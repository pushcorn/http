module.exports = function (nit, http, Self)
{
    const writer = new nit.Object.Property.Writer ();

    return (Self = http.defineService ("SocketIo"))
        .m ("error.unexpected_error", "%{stack \\|\\| message}")
        .use ("http.Context")
        .use ("http.SocketIo")
        .condition ("http:custom", (ctx, owner) => owner.shouldHandleRequest (ctx.req))
        .field ("[path]", "string", "The socket path.", "/socket.io")
        .field ("[serveClient]", "boolean", "Whether to serve the client script.", true)
        .property ("io", "http.SocketIo.Server", { writer })
        .getter ("engine", "io.engine")
        .getter ("emit", "io.emit")
        .getter ("send", "io.sockets.send")
        .getter ("sockets", "io.sockets")

        .staticMemo ("clientDistDir", function ()
        {
            let file = nit.resolveAsset ("node_modules/socket.io/client-dist/socket.io.js");

            return file && nit.new ("nit.Dir", nit.path.dirname (file));
        })
        .staticMemo ("clientFiles", function ()
        {
            let dir = this.clientDistDir;

            return dir ? dir.read () : [];
        })
        .defineInnerClass ("Response", Response =>
        {
            Response
                .field ("status", "integer", "The status code.")
                .field ("message", "string", "The status message.")
                .field ("headers", "object", "The response headers.")
                .field ("body", "any", "The response body.")
            ;
        })
        .onPreInit (function ()
        {
            let self = this;
            let { host, path } = self;
            let nodeServer = host.server.nodeServer;

            nodeServer.on = function () { return this; };
            self.io = writer.value (new Self.SocketIo.Server (nodeServer, { path, serveClient: false }));

            self.io.on ("connection", function (socket)
            {
                socket.on ("message", nit.typedFunc (
                    {
                        method: "string", path: "string", data: "object", cb: "function"
                    },
                    async function (method, path, data, cb)
                    {
                        let req = nit.new ("http.mocks.IncomingMessage", method, path, { data, socket, headers: socket.handshake?.headers });
                        let res = nit.new ("http.mocks.ServerResponse");
                        let ctx = await self.handleRequest (req, res);

                        if (nit.is.func (cb))
                        {
                            await ctx.writeResponse ();

                            let cr = ctx.response;
                            let response = new Self.Response (
                            {
                                status: cr.constructor.status,
                                message: cr.constructor.message,
                                body: ctx.responseBody,
                                headers: ctx.responseHeaders
                            });

                            cb (response.toPojo ()); // eslint-disable-line callback-return
                        }
                    }
                ));
            });

            delete nodeServer.on;
            delete self.io.httpServer;
        })
        .onPreUpgrade (function (req, socket, head)
        {
            if (this.engine.opts.transports.includes ("websocket")
                && this.shouldHandleRequest (req))
            {
                this.engine.handleUpgrade (req, socket, head);
            }
            else
            if (socket.writable && socket.bytesWritten <= 0)
            {
                socket.end ();
            }
        })
        .onPreDispatch (function (ctx)
        {
            let { req, res } = ctx;
            let self = this;

            if (!self.shouldHandleRequest (req))
            {
                return;
            }

            let parts;

            if (self.serveClient
                && (parts = req.path.split ("/"))
                && parts.length == 3
                && Self.clientFiles.includes (parts[2]))
            {
                ctx.sendFile (Self.clientDistDir.join (parts[2]));
            }
            else
            {
                self.engine.handleRequest (req, res);

                ctx.noop ();
            }
        })
        .onPreStop (function ()
        {
            this.io.disconnectSockets ();
            this.io.close ();
            this.engine.close ();
        })
        .method ("handleRequest", async function (req, res)
        {
            let self = this;
            let ctx = new Self.Context (req, res, { server: self.server, host: self.host, service: self });

            ctx.handler = self.handlers.find (h => h.applicableTo (ctx));

            try
            {
                await ctx.handler?.dispatch (ctx);

                ctx.response = ctx.response || http.responseFor (404);
            }
            catch (error)
            {
                if (nit.is.int (error))
                {
                    ctx.response = http.responseFor (error);
                }
                else
                if (error instanceof http.Response)
                {
                    ctx.response = error;
                }
                else
                {
                    self.error ("error.unexpected_error", nit.clone.shallow (error, true));

                    ctx.response = nit.new ("http.responses.RequestFailed", { code: error.code });
                }
            }

            return ctx;
        })
        .method ("shouldHandleRequest", function (req)
        {
            let mgrPath = nit.path.normalize (this.path + "/");
            let reqPath = nit.path.normalize (nit.url.parse (req.url).pathname + "/");

            return reqPath.startsWith (mgrPath);
        })
    ;
};
