module.exports = function (nit, http, Self)
{
    let writer = new nit.Object.Property.Writer;

    return (Self = nit.defineClass ("http.Server"))
        .m ("error.port_in_use", "The port %{port} is already in use.")
        .m ("error.unexpected_error", "%{stack \\|\\| message}")
        .m ("error.shutdown_error", "%{stack \\|\\| message}")
        .m ("info.server_started", "%{name} (%{version}) started on %{address}:%{port}.")
        .m ("info.stopping_server", "Stopping the server...")
        .m ("info.server_stopped", "Server stopped.")
        .m ("warn.force_exit_after_timeout", "Force exit the process after timeout.")
        .use ("*http")
        .use ("*https")
        .use ("*http2")
        .mixin ("http:describable")
        .plugin ("logger", { timestamp: true })
        .plugin ("event-emitter", "init", "start", "stop", "upgrade", "dispatch")

        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .field ("hosts...", "http.Host.Descriptor")
                .field ("names...", "string", "The target host names.")
                .field ("services...", "http.Service.Descriptor")
                .field ("certificate", "http.Certificate.Descriptor", "The SSL certificate.")
                // assetResolvers and templateLoaders from plugins

                .onConfigure (function (server)
                {
                    let self = this;

                    server.hosts.push (...self.hosts.map (d => d.build ()));

                    if (!nit.is.empty.nested ([self.services, self.certificate, self.names]))
                    {
                        let host = http.Host.Descriptor (
                        {
                            names: self.names,
                            services: self.services,
                            certificate: self.certificate

                        });

                        server.hosts.push (host.build ());
                    }
                })
            ;
        })

        .field ("port", "integer", "The non-SSL port.", 80)
        .field ("address", "string", "The listening host name or IP.", "0.0.0.0")
        .field ("name", "string", "The server name.", "nit http server")
        .field ("version", "string", "The server version", () => require (nit.path.join (__dirname, "../../package.json")).version)

        .field ("sslPort", "integer", "The SSL port.", 443)
        .field ("keepAliveTimeout", "integer", "The Keep-Alive timeout in milliseconds.", 30000)
            .constraint ("min", 0)

        .field ("oneShot", "boolean", "Handle one request then quit. This is used for debugging.")
        .field ("requestCert", "boolean", "Request the client certificate.")
        .field ("http2", "boolean", "Use HTTP/2.", true)
        .field ("stopTimeout", "integer", "The time (ms) to wait before the server ends all connections when it's stopped.", 5 * 1000)
        .field ("logFormat", "string", "The log format string.", "[%{req.hostname|shortHostname}] %{req.realIp} %{user ?? '-'} %{res.statusCode} %{req.method} %{req.url} HTTP/%{req.httpVersion} %{req.userAgent} %{responseContentLength ?? '-'} %{(elapsed ?? 0) / 1000}")
        .field ("hosts...", "http.Host", "The hosts to be served.")

        .plugin ("http:asset-resolver")
        .plugin ("http:template-loader")
        .property ("sockets", "object")
        .property ("nodeServer", "any")
        .property ("started", "boolean", { writer })
        .property ("stopped", "boolean", { writer })

        .memo ("ready", function ()
        {
            return new nit.Deferred (24 * 60 * 60 * 1000);
        })
        .getter ("realIp", function ()
        {
            return this.nodeServer.address ().address;
        })
        .getter ("realPort", function ()
        {
            return this.nodeServer.address ().port;
        })
        .do (function ()
        {
            Self
                .lookupPlugin ("plugins.Logger")
                .registerTransform ("shortHostname", function (hostname)
                {
                    return hostname.split (".")
                        .map ((p, i) => (i ? p[0] : p))
                        .join (".")
                    ;
                })
            ;
        })

        .staticMethod ("selectObjectForHost", function (objects, host)
        {
            let ctx = http.Context.new ({ headers: { host } });

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
        .lifecycleMethod ("preStop")
        .lifecycleMethod ("postStop")
        .lifecycleMethod ("stop", async function ()
        {
            let self = this;
            let cls = self.constructor;

            if (self.stopped)
            {
                return self;
            }

            await self.ready;
            await self.preStop ();

            self.info ("info.stopping_server");

            await cls[cls.kStop]?.call (self);

            self.stopped = writer.value (true);

            for (let host of self.hosts)
            {
                try
                {
                    await host.stop ();
                }
                catch (e)
                {
                    self.error ("error.shutdown_error", nit.clone.shallow (e, true));
                }
            }

            await self.endSockets ();
            await self.emit ("stop");

            let { nodeServer } = self;

            nodeServer?.removeAllListeners ();

            if (nodeServer?.listening)
            {
                await nit.promisify (nodeServer, "close") ();
            }

            if (self.stopTimeout)
            {
                setTimeout (() => { self.warn ("warn.force_exit_after_timeout"); process.exit (0); }, self.stopTimeout).unref (); // eslint-disable-line no-process-exit
            }

            self.info ("info.server_stopped");

            await self.postStop ();

            return self;
        })
        .lifecycleMethod ("preDispatch")
        .lifecycleMethod ("postDispatch")
        .lifecycleMethod ("dispatch", async function (req, res)
        {
            let self = this;
            let cls = self.constructor;
            let ctx = new http.Context (req, res, { server: self });

            await self.preDispatch (ctx);

            try
            {
                self.trackSocketRequest (req, res);

                let host = self.hosts.find (s => s.applicableTo (ctx));

                await cls[cls.kDispatch].call (self, ctx, host);
                await self.emit ("dispatch", ctx, host);

                ctx.response = ctx.response || http.responseFor (404);
            }
            catch (e)
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
                    self.error ("error.unexpected_error", nit.clone.shallow (e, true));

                    ctx.response = http.responseFor (500);
                }
            }
            finally
            {
                try
                {
                    await ctx.writeResponse ();
                }
                catch (error)
                {
                    self.error ("error.unexpected_error", nit.clone.shallow (error, true));

                    res
                        .writeHead (500)
                        .end ()
                    ;
                }

                self.info (self.logFormat, ctx);
            }

            await self.postDispatch (ctx);

            if (self.oneShot)
            {
                res.on ("finish", function ()
                {
                    return self.stop ();
                });
            }

            return ctx;
        }
        ,
        async function (ctx, host)
        {
            if (host)
            {
                await host.dispatch (ctx);
            }
        })
        .lifecycleMethod ("preStart")
        .lifecycleMethod ("postStart")
        .lifecycleMethod ("start", async function ()
        {
            let self = this;
            let cls = self.constructor;

            if (self.started)
            {
                return self;
            }

            self.started = writer.value (true);

            await self.preStart ();

            let ssl = self.hosts.some (h => h.certificate);
            let port = ssl ? self.sslPort : self.port;

            if (ssl)
            {
                self.nodeServer = (self.http2 ? Self.http2.createSecureServer : Self.https.createServer) (
                {
                    allowHTTP1: true,
                    requestCert: self.requestCert,
                    SNICallback: (host, cb) =>
                    {
                        cb (null, Self.selectObjectForHost (self.hosts, host)?.certificate?.secureContext);
                    }
                });
            }
            else
            {
                self.nodeServer = Self.http.createServer ();
            }

            function stop ()
            {
                nit.SHUTDOWN_EVENTS.forEach (e => process.removeListener (e, stop));

                self.stop ();
            }

            nit.SHUTDOWN_EVENTS.forEach (e => process.on (e, stop));

            for (let host of self.hosts)
            {
                await host.init (self);
            }

            await self.emit ("init");

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
                .on ("upgrade", async function (req, socket, head)
                {
                    await Self.selectObjectForHost (self.hosts, req.hostname)?.upgrade (req, socket, head);
                    await self.emit ("upgrade", req, socket, head);
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
                    self.info ("info.server_started", self.nodeServer.address (), nit.pick (self, "name", "version"));

                    await cls[cls.kStart]?.call (self);

                    for (let host of self.hosts)
                    {
                        await host.start ();
                    }

                    await self.emit ("start");
                    await self.postStart ();

                    self.ready.resolve (self);
                })
            ;

            return self.ready;
        })
    ;
};
