module.exports = function (nit, http, Self)
{
    return (Self = http.defineConditional ("http.Middleware"))
        .m ("error.response_not_allowed", "The response '%{type}' is not allowed.")
        .mix ("logger")
        .categorize ("http.middlewares")

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
                .getter ("send", "root.send")
                .getter ("noop", "root.noop")
                .delegate ("request", "root.request")
                .delegate ("response", "root.response")
            ;
        })
        .defineInnerPlugin ("MiddlewarePlugin", MiddlewarePlugin =>
        {
            MiddlewarePlugin
                .categorize ("http.middlewareplugins")
                .lifecycleMethod ("preRun", null, /* istanbul ignore next */ function (ctx, middleware) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postRun", null, /* istanbul ignore next */ function (ctx, middleware) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("preCatch", null, /* istanbul ignore next */ function (ctx, middleware) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postCatch", null, /* istanbul ignore next */ function (ctx, middleware) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("preFinally", null, /* istanbul ignore next */ function (ctx, middleware) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postFinally", null, /* istanbul ignore next */ function (ctx, middleware) {}) // eslint-disable-line no-unused-vars
            ;
        })
        .staticProperty ("responses...", "function")

        .staticMethod ("endpoint", function (method, path)
        {
            return this
                .condition ("http:request-method", method)
                .condition ("http:request-path", path)
            ;
        })
        .staticMethod ("response", function (response)
        {
            let cls = nit.lookupComponent (response, "responses", "http.Response");

            this.responses.push (cls);

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
                    await cls.applyPlugins ("middlewareplugins", "preRun", ctx, self);
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
                    await cls.applyPlugins ("middlewareplugins", "postRun", ctx, self);
                }
            }
            catch (e)
            {
                if (ctx)
                {
                    ctx.error = e;

                    try
                    {
                        await cls.applyPlugins ("middlewareplugins", "preCatch", ctx, self);
                        await self.catch (ctx);
                    }
                    finally
                    {
                        await cls.applyPlugins ("middlewareplugins", "postCatch", ctx, self);
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
                    await cls.applyPlugins ("middlewareplugins", "preFinally", ctx, self);
                    await self.finally (ctx);
                }
                finally
                {
                    await cls.applyPlugins ("middlewareplugins", "postFinally", ctx, self);
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
