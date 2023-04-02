module.exports = function (nit, http, Self)
{
    const writer = new nit.Object.Property.Writer ();


    return (Self = http.service.definePlugin ("SocketIoServer"))
        .require ("http.SocketIo")
        .field ("[path]", "string", "The socket path.", "/socket.io")

        .defineInnerClass ("Manager", Manager =>
        {
            Manager
                .field ("<nodeServer>", "any", "The node HTTP server.")
                .field ("<path>", "string", "The request path.")
                .property ("io", "http.SocketIo.Server")

                .construct (function (nodeServer, path)
                {
                    nodeServer.on = function () { return this; };

                    this.io = new http.SocketIo.Server (nodeServer,
                    {
                        path,
                        serveClient: false
                    });

                    delete nodeServer.on;
                })
                .method ("shouldHandleRequest", async function (req)
                {
                    let mgrPath = nit.path.normalize (this.path + "/");
                    let reqPath = nit.path.normalize (nit.url.parse (req.url).pathname + "/");

                    return reqPath.startsWith (mgrPath);
                })
                .method ("handleRequest", async function (req, res)
                {
                    if (await this.shouldHandleRequest (req))
                    {
                        this.io.engine.handleRequest (req, res);

                        return true;
                    }

                    return false;
                })
                .method ("handleUpgrade", async function (req, socket, head)
                {
                    if (this.io.engine.opts.transports.includes ("websocket")
                        && await this.shouldHandleRequest (req))
                    {
                        this.io.engine.handleUpgrade (req, socket, head);

                        return true;
                    }
                    else
                    if (socket.writable && socket.bytesWritten <= 0)
                    {
                        socket.end ();
                    }

                    return false;
                })
            ;
        })
        .staticMethod ("onUsePlugin", function (Service)
        {
            Service
                .m ("error.unexpected_error", "%{error.message}")
                .staticProperty ("socketEndpoints...", "http.Service.Endpoint")
                .staticMethod ("socketEndpoint", function (method, path, handler)
                {
                    if (nit.is.str (handler))
                    {
                        let cls = nit.lookupComponent (handler, "handlers", "http.Handler");

                        handler = nit.new (cls, nit.array (arguments).slice (3));
                    }

                    this.socketEndpoints.push (
                    {
                        route: { method, path },
                        handler
                    });

                    return this;
                })
                .staticMethod ("soGet", function (path, handler)
                {
                    return this.socketEndpoint ("GET", path, handler);
                })
                .staticMethod ("soPost", function (path, handler)
                {
                    return this.socketEndpoint ("POST", path, handler);
                })
                .staticMethod ("soPut", function (path, handler)
                {
                    return this.socketEndpoint ("PUT", path, handler);
                })
                .staticMethod ("soDelete", function (path, handler)
                {
                    return this.socketEndpoint ("DELETE", path, handler);
                })
                .property ("socketIo", Self.name + ".Manager", { writer })

                .method ("dispatchSocketRequest", async function (req, res)
                {
                    let self = this;
                    let cls = self.constructor;
                    let ctx = nit.new (cls.Context, req, res, { server: self.server, service: self });

                    try
                    {
                        for (let endpoint of cls.socketEndpoints)
                        {
                            if (endpoint.matches (ctx))
                            {
                                ctx.route = endpoint.route;

                                await ctx.parseRequest ();
                                await endpoint.handler.run (ctx);

                                break;
                            }
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
                            self.error ("error.unexpected_error", { error: nit.clone.deep (e) });

                            ctx.response = http.responseFor (500);
                        }
                    }

                    return ctx;
                })
            ;
        })
        .method ("preDispatch", async function (service, ctx)
        {
            if (await service.socketIo.handleRequest (ctx.req, ctx.res))
            {
                ctx.noop ();
            }
        })
        .method ("onInit", function (service)
        {
            let cls = this.constructor;
            let mgr = new cls.Manager (service.server.nodeServer, this.path);

            service.socketIo = writer.value (mgr);

            mgr.io.on ("connection", function handleConnection (socket)
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
                    let ctx = await service.dispatchSocketRequest (req, res);

                    if (nit.is.func (cb))
                    {
                        cb (ctx.response.toPojo ()); // eslint-disable-line callback-return
                    }
                });
            });
        })
        .method ("onUpgrade", async function (service, req, socket, head)
        {
            await service.socketIo.handleUpgrade (req, socket, head);
        })
        .method ("onStop", async function (service)
        {
            service.socketIo?.io?.close ();
        })
    ;
};
