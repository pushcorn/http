module.exports = function (nit, http, Self)
{
    let writer = new nit.Object.Property.Writer;

    return (Self = nit.defineClass ("http.Server"))
        .m ("error.port_in_use", "The port %{port} is already in use.")
        .m ("error.unexpected_error", "%{stack \\|\\| message}")
        .m ("error.shutdown_error", "%{stack \\|\\| message}")
        .m ("info.server_started", "The server started on %{address}:%{port}.")
        .m ("info.stopping_server", "Stopping the server...")
        .m ("info.server_stopped", "Server stopped.")
        .m ("warn.force_exit_after_timeout", "Force exit the process after timeout.")
        .use ("*http")
        .use ("*https")
        .use ("*http2")
        .mix ("logger")

        .field ("port", "integer", "The non-SSL port.", 80)
        .field ("address", "string", "The listening host name or IP.", "0.0.0.0")
        .field ("name", "string", "The server name.", "nit")

        .field ("sslPort", "integer", "The SSL port.", 443)
        .field ("keepAliveTimeout", "integer", "The Keep-Alive timeout in milliseconds.", 30000)
            .constraint ("min", 0)

        .field ("oneShot", "boolean", "Handle one request then quit. This is used for debugging.")
        .field ("requestCert", "boolean", "Request the client certificate.")
        .field ("http2", "boolean", "Use HTTP/2.", true)
        .field ("stopTimeout", "integer", "The time (ms) to wait before the server ends all connections when it's stopped.", 5 * 1000)
        .field ("logFormat", "string", "The log format string.", "[%{req.hostname|shortHostname}] %{req.realIp} %{user ?? '-'} %{res.statusCode} %{req.method} %{req.url} HTTP/%{req.httpVersion} %{req.userAgent} %{responseContentLength ?? '-'} %{(elapsed ?? 0) / 1000}")
        .field ("descriptor", "http.descriptors.Server", "The descriptor used to configure the server.",
        {
            defval:
            {
                services:
                [
                {
                    name: "http:file-server",
                    options: true,
                    plugins:
                    [
                        "http:socket-io-server",
                        "http:live-reload"
                    ]
                }
                ,
                "http:auto-restart"
                ]
            }
        })

        .property ("contextClass", "function", (prop, obj) => obj.constructor.Context.defineSubclass (obj.constructor.Context.name + "$$" + nit.uuid ().slice (0, 8), true))
        .property ("services...", "http.Service")
        .property ("certificates...", "http.Certificate")
        .property ("sockets", "object")
        .property ("nodeServer", "any")
        .property ("stopped", "boolean", { writer })

        .getter ("realIp", function ()
        {
            return this.nodeServer.address ().address;
        })
        .getter ("realPort", function ()
        {
            return this.nodeServer.address ().port;
        })
        .memo ("version", function ()
        {
            return require (nit.path.join (__dirname, "../../package.json")).version;
        })

        .do (function ()
        {
            this.loggerOptions.registerTransform ("shortHostname", function (hostname)
            {
                return hostname.split (".")
                    .map ((p, i) => (i ? p[0] : p))
                    .join (".")
                ;
            });
        })

        .defineInnerClass ("Context", "http.Context", Context =>
        {
            Context
                .requestfilter ("http:json-body-parser")
                .requestfilter ("http:multipart-body-parser")
                .requestfilter ("http:url-encoded-body-parser")
                .requestfilter ("http:text-body-parser")

                .responsefilter ("http:content-headers-builder")
                .responsefilter ("http:body-compressor")
                .responsefilter ("http:etag-builder")
                .responsefilter ("http:cache-controller")
            ;
        })
        .staticMethod ("selectObjectForHost", function (objects, host)
        {
            let ctx = http.Context.create ({ headers: { host } });

            return objects.find (o => o.applicableTo (ctx));
        })
        .method ("addSocket", function (socket)
        {
            let self = this;

            nit.dpv (socket, "id", socket.id || nit.uuid ());

            self.sockets[socket.id] = socket
                .on ("timeout", function ()
                {
                    socket.end ();
                })
                .on ("close", function ()
                {
                    return self.removeSocket (socket);
                })
            ;

            return this;
        })
        .method ("removeSocket", function (socket)
        {
            delete this.sockets[socket.id];

            return this;
        })
        .method ("trackSocketRequest", function (req, res)
        {
            let self = this;
            let { socket } = req;

            socket.requests.push (req);

            res.once ("finish", function ()
            {
                nit.arrayRemove (socket.requests, req);

                if (self.stopped && !socket.requests.length)
                {
                    socket.end ();
                }
            });

            return this;
        })
        .method ("endSockets", async function ()
        {
            let self = this;

            await nit.each (self.sockets, async function (socket)
            {
                self.removeSocket (socket);

                try
                {
                    await nit.promisify (socket, "end") ();
                }
                catch (e)
                {
                }
            });
        })
        .method ("stop", async function ()
        {
            let self = this;

            if (self.stopped)
            {
                return self;
            }

            self.info ("info.stopping_server");

            self.stopped = writer.value (true);

            for (let service of self.services)
            {
                try
                {
                    await service.stop ();
                }
                catch (e)
                {
                    self.error ("error.shutdown_error", nit.clone.shallow (e));
                }
            }

            await self.endSockets ();

            let { nodeServer } = self;

            nodeServer.removeAllListeners ();

            if (nodeServer && nodeServer.listening)
            {
                await nit.promisify (nodeServer, "close") ();
            }

            if (self.stopTimeout)
            {
                setTimeout (() => { self.warn ("warn.force_exit_after_timeout"); process.exit (0); }, self.stopTimeout).unref (); // eslint-disable-line no-process-exit
            }

            self.info ("info.server_stopped");

            return self;
        })
        .method ("dispatch", async function (req, res)
        {
            let self = this;
            let ctx;
            let error;

            try
            {
                self.trackSocketRequest (req, res);

                ctx = new self.contextClass (req, res, { server: self });

                let service = self.services.find (s => s.applicableTo (ctx));

                if (service)
                {
                    ctx = new service.contextClass (req, res, { server: self });

                    await service.dispatch (ctx);
                }

                ctx.response = ctx.response || http.responseFor (404);
            }
            catch (e)
            {
                if (ctx)
                {
                    if (nit.is.int (e))
                    {
                        ctx.response = http.responseFor (e);
                    }
                    else
                    if (e instanceof http.Response)
                    {
                        ctx.response = e;
                    }
                    else
                    {
                        self.error ("error.unexpected_error", nit.clone.shallow (e));

                        ctx.response = http.responseFor (500);
                    }
                }
                else
                {
                    error = e;
                }
            }
            finally
            {
                if (ctx)
                {
                    try
                    {
                        await ctx.writeResponse ();
                        error = null;
                    }
                    catch (e)
                    {
                        error = e;
                    }
                }

                if (error)
                {
                    self.error ("error.unexpected_error", nit.clone.shallow (error));

                    res
                        .writeHead (500)
                        .end ()
                    ;
                }

                self.info (self.logFormat, ctx || { req, res });
            }

            if (self.oneShot)
            {
                res.on ("finish", function ()
                {
                    return self.stop ();
                });
            }

            return ctx;
        })
        .method ("start", async function ()
        {
            let self = this;

            await self.descriptor.configure (self);

            let ssl = self.certificates.length;
            let port = ssl ? self.sslPort : self.port;
            let ready = nit.Deferred ();

            if (ssl)
            {
                self.nodeServer = (self.http2 ? Self.http2.createSecureServer : Self.https.createServer) (
                {
                    allowHTTP1: true,
                    requestCert: self.requestCert,
                    SNICallback: (host, cb) =>
                    {
                        cb (null, Self.selectObjectForHost (self.certificates, host)?.secureContext);
                    }
                });
            }
            else
            {
                self.nodeServer = Self.http.createServer ();
            }

            let stop = self.stop.bind (self);

            process
                .on ("SIGTERM", stop)
                .on ("SIGINT", stop)
                .on ("SIGHUP", stop)
            ;

            for (let service of self.services)
            {
                await service.init (self);
            }

            self.nodeServer
                .on ("connection", function (socket)
                {
                    if (self.keepAliveTimeout)
                    {
                        socket.setKeepAlive (true);
                        socket.setTimeout (self.keepAliveTimeout);
                    }
                    else
                    {
                        socket.setKeepAlive (false);
                    }

                    self.addSocket (socket);
                })
                .on ("request", function (req, res)
                {
                    return self.dispatch (req, res);
                })
                .on ("upgrade", function (req, socket, head)
                {
                    return Self.selectObjectForHost (self.services, req.hostname)?.upgrade (req, socket, head);
                })
                .on ("error", async function (e)
                {
                    await self.stop ();

                    if (e.code == "EADDRINUSE")
                    {
                        self.throw ("error.port_in_use", { port });
                    }

                    throw e;
                })
                .listen (port, self.address, async function ()
                {
                    self.info ("info.server_started", self.nodeServer.address ());

                    for (let service of self.services)
                    {
                        await service.start ();
                    }

                    ready.resolve ();
                })
            ;

            return ready;
        })
    ;
};
