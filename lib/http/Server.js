module.exports = function (nit, http, Self)
{
    let writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("http.Server"))
        .m ("error.port_in_use", "The port %{port} is already in use.")
        .m ("error.unexpected_error", "%{stack \\|\\| message}")
        .m ("info.server_started", "The server started on %{address}:%{port}.")
        .use ("*http")
        .use ("*https")
        .use ("*http2")
        .use ("http.Context")
        .mix ("loggable")

        .field ("port", "integer", "The non-SSL port.", 80)
        .field ("address", "string", "The listening host name or IP.", "0.0.0.0")
        .field ("name", "string", "The server name.", "nit")
        .field ("services...", "http.Service", "The services to run.")

        .field ("sslPort", "integer", "The SSL port.", 443)
        .field ("cert", "nit.File", "The path of the SSL certificate.")
            .constraint ("dependent", "key")
        .field ("key", "nit.File", "The path of the SSL private key.")
            .constraint ("dependent", "cert")
        .field ("ca", "nit.File", "The path of the CA cert.")

        .field ("keepAliveTimeout", "integer", "The Keep-Alive timeout in milliseconds.", 30000)
            .constraint ("min", 0)

        .field ("oneShot", "boolean", "Handle one request then quit. This is used for debugging.")
        .field ("requestCert", "boolean", "Request the client certificate.")
        .field ("noHttp2", "boolean", "Use HTTP/2.")
        .field ("stopTimeout", "integer", "The time (ms) to wait before the server ends all connections when it's stopped.", 10 * 1000)

        .property ("sockets", "object")
        .property ("nodeServer", "any")
        .property ("stopped", "boolean", { writer })

        .memo ("version", function ()
        {
            return require (nit.path.join (__dirname, "../../package.json")).version;
        })
        .memo ("secureContext", function ()
        {
            if (this.key)
            {
                return http.createSecureContext (this.cert, this.key, this.ca);
            }
        })

        .method ("selectService", function (hostname)
        {
            let p = 0;
            let s;

            for (let service of this.services)
            {
                let priority = service.getPriority (hostname);

                if (priority > p)
                {
                    p = priority;
                    s = service;
                }
            }

            return s;
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
        .method ("endSockets", function ()
        {
            nit.each (this.sockets, socket =>
            {
                this.removeSocket (socket);

                socket.end ();
            });
        })
        .method ("stop", async function ()
        {
            let self = this;

            if (self.stopped)
            {
                return self;
            }

            self.stopped = writer.value (true);

            for (let service of this.services)
            {
                await service.stop ();
            }

            setTimeout (() => self.endSockets (), self.stopTimeout).unref ();

            let { nodeServer } = self;

            if (nodeServer && nodeServer.listening)
            {
                await nit.promisify (nodeServer, "close") ();
            }

            return self;
        })
        .method ("dispatch", async function (req, res)
        {
            let self = this;
            let ctx;

            try
            {
                self.trackSocketRequest (req, res);

                let service = self.selectService (req.hostname);
                let ctxCls = service && service.constructor.Context || Self.Context;

                ctx = new ctxCls (req, res, { server: self, service });

                if (service)
                {
                    await service.dispatch (ctx);
                }

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
                    self.log ("error.unexpected_error", nit.clone.deep (e));

                    ctx.response = http.responseFor (500);
                }
            }
            finally
            {
                try
                {
                    await ctx.writeResponse ();
                }
                catch (e)
                {
                    self.log ("error.unexpected_error", nit.clone.deep (e));

                    res
                        .writeHead (500)
                        .end ()
                    ;
                }
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
            let port = self.key ? self.sslPort : self.port;

            if (self.key)
            {
                self.nodeServer = (self.noHttp2 ? Self.https.createServer : Self.http2.createSecureServer) (
                {
                    allowHTTP1: true,
                    requestCert: self.requestCert,
                    SNICallback: (domain, cb) =>
                    {
                        let service = self.selectService (domain);
                        let secureContext = service.secureContext || self.secureContext;

                        cb (null, secureContext);
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
                    return self.selectService (req.hostname)?.upgrade (req, socket, head);
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
                    self.log ("info.server_started", { address: self.address, port });

                    for (let service of self.services)
                    {
                        await service.start (port, self.address);
                    }
                })
            ;
        })
    ;
};
