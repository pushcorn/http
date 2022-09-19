module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.Service"))
        .field ("[hostnames...]", "string", "The hostnames or patterns that the server uses to select the service.", ["*"])
        .field ("cert", "nit.File", "The path of the SSL certificate.")
            .constraint ("dependent", "key")
        .field ("key", "nit.File", "The path of the SSL private key.")
            .constraint ("dependent", "cert")
        .field ("ca", "nit.File", "The path of the CA cert.")

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

        .defineInnerClass ("Endpoint", Endpoint =>
        {
            Endpoint
                .field ("<route>", "http.Route", "The route information.")
                .field ("<handler>", "http.Handler", "The request handler.")
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
                let cls = nit.lookupComponent (handler, "handlers", Self.Handler);

                handler = nit.new (cls, nit.array (arguments).slice (3));
            }

            this.endpoints.push (
            {
                route: { method, path },
                handler
            });

            return this;
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
        .method ("dispatch", async function (method, path, reqParams)
        {
            let req = nit.new ("http.MockIncomingMessage", method, path, reqParams);
            let res = nit.new ("http.MockServerResponse");
            let ctx = nit.new ("http.Context", req, res);

            return await this.run (ctx);
        })
        .method ("run", async function (ctx)
        {
            let cls = this.constructor;

            ctx.service = this;

            for (let endpoint of cls.endpoints)
            {
                if (endpoint.matches (ctx))
                {
                    ctx.route = endpoint.route;

                    await ctx.parseRequest ();
                    await endpoint.handler.run (ctx);

                    break;
                }
            }

            return ctx;
        })
    ;
};
