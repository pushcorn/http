module.exports = function (nit, http, Self)
{
    const writer = new nit.Object.Property.Writer ();

    return (Self = http.defineServicePlugin ("SocketIoServer"))
        .use ("http.Context")
        .use ("http.SocketIo")
        .field ("[path]", "string", "The socket path.", "/socket.io")
        .field ("[serveClient]", "boolean", "Whether to serve the client script.", true)

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
        .defineInnerClass ("Manager", Manager =>
        {
            Manager
                .m ("error.unexpected_error", "%{stack \\|\\| message}")
                .plugin ("logger")
                .field ("<service>", "http.Service", "The service to which the manager is attached.")
                .field ("<path>", "string", "The request path.", "/socket.io")
                .field ("[serveClient]", "boolean", "Whether to serve the client script.")

                .property ("io", "http.SocketIo.Server")
                .getter ("engine", "io.engine")
                .getter ("emit", "io.emit")
                .getter ("send", "io.sockets.send")
                .getter ("sockets", "io.sockets")

                .onConstruct (function (service, path)
                {
                    let nodeServer = service.server.nodeServer;
                    let self = this;

                    nodeServer.on = function () { return this; };

                    self.io = new Self.SocketIo.Server (nodeServer, { path, serveClient: false });

                    self.io.on ("connection", function (socket)
                    {
                        socket.on ("message", async function (method, path, data, cb)
                        {
                            ({ method, path, data, cb } = nit.typedArgsToObj (arguments,
                            {
                                method: "string",
                                path: "string",
                                data: "object",
                                cb: "function"
                            }));

                            let req = nit.new ("http.mocks.IncomingMessage", method, path, { data, socket, headers: socket.handshake?.headers });
                            let res = nit.new ("http.mocks.ServerResponse");
                            let ctx = await self.dispatch (req, res);

                            if (nit.is.func (cb))
                            {
                                ctx = ctx || new Self.Context (req, res);
                                ctx.response = ctx.response || http.responseFor (500);

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
                        });
                    });

                    delete nodeServer.on;
                    delete self.io.httpServer;
                })
                .method ("dispatch", async function (req, res)
                {
                    let self = this;
                    let service = self.service;
                    let ctx;
                    let error;

                    try
                    {
                        ctx = new service.contextClass (req, res, { server: self.server });
                        ctx.socketIo = writer.value (self);

                        await service.dispatch (ctx);

                        ctx.response = ctx.response || http.responseFor (500);
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
                                self.error ("error.unexpected_error", nit.clone.shallow (e, true));

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
                            error = null;
                        }

                        if (error)
                        {
                            self.error ("error.unexpected_error", nit.clone.shallow (error, true));
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
                .method ("handleRequest", function (ctx)
                {
                    let { req, res } = ctx;
                    let self = this;

                    if (self.shouldHandleRequest (req))
                    {
                        let parts;

                        if (self.serveClient
                            && (parts = req.path.split ("/"))
                            && parts.length == 3
                            && Self.clientFiles.includes (parts[2]))
                        {
                            ctx.send ("http:file-returned", Self.clientDistDir.join (parts[2]));
                        }
                        else
                        {
                            self.engine.handleRequest (req, res);

                            ctx.noop ();
                        }

                        return true;
                    }

                    return false;
                })
                .method ("handleUpgrade", function (req, socket, head)
                {
                    if (this.engine.opts.transports.includes ("websocket")
                        && this.shouldHandleRequest (req))
                    {
                        this.engine.handleUpgrade (req, socket, head);

                        return true;
                    }
                    else
                    if (socket.writable && socket.bytesWritten <= 0)
                    {
                        socket.end ();
                    }

                    return false;
                })
                .method ("close", function ()
                {
                    this.io.disconnectSockets ();
                    this.io.close ();
                    this.engine.close ();
                })
            ;
        })
        .staticMethod ("onUsePlugin", function (Service)
        {
            Service.property ("socketIo", Self.name + ".Manager", { writer });
        })
        .onPreInit (function (service)
        {
            let self = this;
            let cls = self.constructor;
            let mgr = new cls.Manager (service, self.path, self.serveClient);

            service.socketIo = writer.value (mgr);
            service.contextClass.property ("socketIo", Self.name + ".Manager", { writer });
        })
        .onPreUpgrade (function (service, req, socket, head)
        {
            service.socketIo.handleUpgrade (req, socket, head);
        })
        .onPreDispatch (function (service, ctx)
        {
            service.socketIo.handleRequest (ctx);
        })
        .onPreStop (function (service)
        {
            service.socketIo.close ();
        })
    ;
};
