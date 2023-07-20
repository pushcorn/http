module.exports = function (nit, http, Self)
{
    return (Self = http.defineConditional ("http.Api"))
        .m ("error.response_not_allowed", "The response '%{type}' is not allowed.")
        .m ("error.no_default_response", "No response was set for the API '%{name}'.")
        .use ("http.Response")
        .plugin ("logger")
        .registerPlugin ("http.ApiPlugin", true)
        .categorize ("http.apis")
        .meta ("description", "string")
        .meta ("responses...", "function")

        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .field ("endpoint", "string", "The endpoint that the api should handle.")
                .field ("conditions...", "http.Condition.Descriptor", "The conditions to check.")
                .field ("plugins...", "http.ApiPlugin.Descriptor", "The plugins to use.")

                .onConfigure (function (api)
                {
                    let self = this;
                    let apiClass = api.constructor;

                    if (self.endpoint)
                    {
                        apiClass.endpoint (...nit.kvSplit (self.endpoint));
                    }

                    self.conditions.forEach (c => apiClass.condition (c.build ()));
                    self.plugins.forEach (p => apiClass.apiplugin (p.build ()));
                })
            ;
        })

        .defineInnerClass ("Request", "http.Request")
        .defineInnerClass ("Context", Context =>
        {
            Context
                .field ("<root>", "http.Context", "The root context.")
                .field ("error", "Error", "The error thrown by the run method.")
                .getter ("req", "root.req")
                .getter ("res", "root.res")
                .getter ("method", "root.method")
                .getter ("path", "root.path")
                .getter ("url", "root.url")
                .getter ("noop", "root.noop")
                .delegate ("request", "root.request")
                .delegate ("response", "root.response")

                .method ("send", function (resp)
                {
                    if (!(resp instanceof Self.Response))
                    {
                        let apiCls = this.constructor.outerClass;
                        let resCls = apiCls.responses[0];

                        if (!resCls)
                        {
                            Self.throw ("error.no_default_response", { name: apiCls.name });
                        }

                        resp = new resCls (resp);
                    }

                    return this.root.send (resp);
                })
            ;
        })

        .staticMethod ("info", function (description)
        {
            return this.assignStatic ({ description });
        })
        .staticMethod ("endpoint", function (method, path)
        {
            return this
                .condition ("http:request-method", method)
                .condition ("http:request-path", path)
            ;
        })
        .staticMethod ("response", function (response) // eslint-disable-line no-unused-vars
        {
            this.responses = nit.array (arguments).map (r => nit.lookupComponent (r, "responses", "http.Response"));

            return this;
        })
        .staticMethod ("defineRequest", function (builder)
        {
            return this.defineInnerClass ("Request", this.superclass.Request.name, builder);
        })
        .staticMethod ("defineContext", function (builder)
        {
            return this.defineInnerClass ("Context", this.superclass.Context.name, builder);
        })
        .onDefineSubclass (Subclass =>
        {
            Subclass.defineRequest ();
            Subclass.defineContext ();
        })
        .lifecycleMethod ("run", async function (root)
        {
            let self = this;
            let cls = self.constructor;
            let ctx;

            try
            {
                ctx = new cls.Context (root);

                await root.readRequest (cls.Request);

                try
                {
                    await cls.applyPlugins ("apiplugins", "preRun", ctx, self);
                    await cls[Self.kRun]?.call (self, ctx);

                    let responseCls = ctx.response?.constructor;

                    if (responseCls
                        && cls.responses.length
                        && !cls.responses.some (r => r == responseCls))
                    {
                        self.throw ("error.response_not_allowed", { type: responseCls.name });
                    }
                }
                finally
                {
                    await cls.applyPlugins ("apiplugins", "postRun", ctx, self);
                }
            }
            catch (e)
            {
                if (ctx)
                {
                    ctx.error = e;

                    try
                    {
                        await cls.applyPlugins ("apiplugins", "preCatch", ctx, self);
                        await self.catch (ctx);
                    }
                    finally
                    {
                        await cls.applyPlugins ("apiplugins", "postCatch", ctx, self);
                    }
                }
                else
                {
                    throw e;
                }
            }
            finally
            {
                // ctx could be null
                try
                {
                    await cls.applyPlugins ("apiplugins", "preFinally", ctx, self);
                    await self.finally (ctx);
                }
                finally
                {
                    await cls.applyPlugins ("apiplugins", "postFinally", ctx, self);
                }
            }
        })
        .lifecycleMethod ("catch", function (ctx)
        {
            let c = this.constructor[Self.kCatch];

            if (c)
            {
                return c.call (this, ctx);
            }
            else
            {
                throw ctx.error;
            }
        })
        .lifecycleMethod ("finally", function (ctx)
        {
            return this.constructor[Self.kFinally]?.call (this, ctx);
        })
    ;
};
