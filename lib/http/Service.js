module.exports = function (nit, http)
{
    return nit.defineClass ("http.Service")
        .field ("[hostnames...]", "string", "The hostnames or patterns that the server uses to select the service.", ["*"])
        .field ("cert", "nit.File", "The path of the SSL certificate.")
            .constraint ("dependent", "key")
        .field ("key", "nit.File", "The path of the SSL private key.")
            .constraint ("dependent", "cert")
        .field ("ca", "nit.File", "The path of the CA cert.")

        .property ("server", "http.Server")

        .memo ("hostnameMatchers", function ()
        {
            return this.hostnames.map (n => nit.new ("http.HostnameMatcher", n));
        })
        .memo ("secureContext", function ()
        {
            if (this.key)
            {
                return http.createSecureContext (this.cert, this.key, this.ca);
            }
        })

        .registerPlugin ("http:service.Plugin")
        .defineInnerClass ("Context", "http.Context", Context =>
        {
            Context
                .requestFilter ("http:json-body-parser")
                .requestFilter ("http:multipart-body-parser")
                .requestFilter ("http:url-encoded-body-parser")
                .requestFilter ("http:text-body-parser")

                .responseFilter ("http:content-headers-builder")
                .responseFilter ("http:body-compressor")
                .responseFilter ("http:etag-builder")
                .responseFilter ("http:cache-controller")
            ;
        })
        .defineInnerClass ("Endpoint", Endpoint =>
        {
            Endpoint
                .field ("<route>", "http.Route", "The route information.")
                .field ("<handler>", "any", "The request handler.")
                    .constraint ("type", "function", "http.Handler")
                .construct (function (route, handler)
                {
                    if (nit.is.func (handler))
                    {
                        const FuncHandler = nit.defineClass ("FuncHandler", "http.Handler", true)
                            .run (handler)
                        ;

                        this.handler = new FuncHandler;
                    }
                })
                .method ("matches", function (ctx)
                {
                    return this.route.method == ctx.method
                        && !!this.route.parse (ctx.path);
                })
            ;
        })

        .staticProperty ("endpoints...", "http.Service.Endpoint")
        .staticMethod ("endpoint", function (method, path, handler)
        {
            if (nit.is.str (handler))
            {
                let cls = nit.lookupComponent (handler, "handlers", "http.Handler");

                handler = nit.new (cls, nit.array (arguments).slice (3));
            }

            this.endpoints.push (
            {
                route: { method, path },
                handler
            });

            return this;
        })
        .staticMethod ("defineContext", function (builder)
        {
            return this.defineInnerClass ("Context", this.Context.name, builder);
        })
        .staticMethod ("get", function (path, handler)
        {
            return this.endpoint ("GET", path, handler);
        })
        .staticMethod ("post", function (path, handler)
        {
            return this.endpoint ("POST", path, handler);
        })
        .staticMethod ("put", function (path, handler)
        {
            return this.endpoint ("PUT", path, handler);
        })
        .staticMethod ("delete", function (path, handler)
        {
            return this.endpoint ("DELETE", path, handler);
        })
        .staticMethod ("head", function (path, handler)
        {
            return this.endpoint ("HEAD", path, handler);
        })
        .onDefineSubclass (Subclass =>
        {
            Subclass.defineContext ();
        })

        .method ("init", async function (server)
        {
            let self = this;
            let cls = self.constructor;

            self.server = server;

            await cls.applyPlugins ("servicePlugins", "onInit", self);
        })
        .method ("start", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("servicePlugins", "onStart", self);
        })
        .method ("stop", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("servicePlugins", "onStop", self);
        })
        .method ("upgrade", async function (req, socket, head)
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("servicePlugins", "onUpgrade", self, req, socket, head);
        })
        .method ("dispatch", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await ctx.parseRequest ();
            await cls.applyPlugins ("servicePlugins", "preDispatch", self, ctx);

            for (let endpoint of cls.endpoints)
            {
                if (endpoint.matches (ctx))
                {
                    ctx.route = endpoint.route;

                    await endpoint.handler.run (ctx);

                    break;
                }
            }

            await cls.applyPlugins ("servicePlugins", "postDispatch", self, ctx);
        })

        .method ("getPriority", function (hostname)
        {
            let priority = 0;

            for (let m of this.hostnameMatchers)
            {
                if (m.matches (hostname))
                {
                    priority = Math.max (priority, m.priority);
                }
            }

            return priority;
        })
    ;
};
