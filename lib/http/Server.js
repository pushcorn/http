module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.Server"))
        .m ("error.port_in_use", "The port %{port} is already in use.")
        .m ("info.server_started", "The server started on %{address}:%{port}.")
        .use ("*http")
        .use ("*https")
        .use ("*http2")

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

        .property ("sockets", "object")
        .property ("server", "any")

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
        .method ("log", function (message, ...args)
        {
            nit.log (this.t (message, ...args));

            return this;
        })
        .method ("stop", async function ()
        {
            let sockets = this.sockets;

            await nit.parallel (nit.each (sockets, async function (socket, id)
            {
                await nit.promisify (socket, "end") ();
                delete sockets[id];
            }));

            if (this.server && this.server.listening)
            {
                await nit.promisify (this.server, "close") ();
            }

            return this;
        })
        .method ("dispatch", async function (req, res)
        {
            let self = this;
            let ctx;

            try
            {
                ctx = nit.new ("http.Context", req, res, { server: self });

                let service = self.selectService (req.hostname);

                if (service)
                {
                    await service.run (ctx);
                }

                ctx.response = ctx.response || nit.new ("http.responses.ResourceNotFound");
                ctx.response.write (res);
            }
            catch (e)
            {
                nit.log ("[UNEXPECTED_ERROR]", e);
                nit.new ("http.responses.RequestFailed").write (res);
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
                self.server = (self.noHttp2 ? Self.https.createServer : Self.http2.createSecureServer) (
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
                self.server = Self.http.createServer ();
            }

            self.server
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

                    socket.id = nit.uuid ();
                    self.sockets[socket.id] = socket
                        .on ("timeout", function ()
                        {
                            socket.end ();
                        })
                        .on ("close", function ()
                        {
                            delete self.sockets[socket.id];
                        })
                    ;
                })
                .on ("request", function (req, res)
                {
                    self.dispatch (req, res);
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
                .listen (port, self.address, function ()
                {
                    self.log ("info.server_started", { address: self.address, port });
                })
            ;
        })
    ;
};
