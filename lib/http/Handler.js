module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.Handler"))
        .k ("run")
        .defineInnerClass ("Request", "http.Request")
        .staticMethod ("defineRequest", function (builder)
        {
            return this.defineInnerClass ("Request", this.Request.name, builder);
        })

        .definePlugin ("Middleware", Middleware =>
        {
            Middleware
                .method ("preRequest", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
                .method ("postRequest", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
                .method ("preRun", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
                .method ("postRun", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
                .method ("preResponse", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
                .method ("postResponse", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
                .method ("onSuccess", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
                .method ("onFailure", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
                .method ("onComplete", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
            ;
        })
        .staticProperty ("responses...", "function")

        .staticMethod ("response", function (response)
        {
            let cls = nit.lookupComponent (response, "responses", http.Response);

            this.responses.push (cls);

            return this;
        })

        .staticMethod ("run", function (run)
        {
            return this.staticMethod (Self.kRun, run);
        })
        .staticMethod ("runMiddlewares", function (method, ctx)
        {
            return this.applyPlugins ("middlewares", method, ctx);
        })
        .method ("buildRequest", function (ctx)
        {
            let cls = this.constructor;
            let allParams = nit.assign ({}, ctx.queryParams, ctx.formParams, ctx.pathParams, ctx.cookieParams, ctx.headerParams);
            let params = {};

            cls.Request.getProperties ()
                .forEach (p =>
                {
                    if (p.source)
                    {
                        params[p.name] = nit.get (ctx, p.source + "Params." + p.sourceName);
                    }
                    else
                    {
                        params[p.name] = allParams[p.name];
                    }
                })
            ;

            return new cls.Request (params);
        })
        .method ("run", function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            ctx.handler = self;

            return nit.Queue ()
                .push (async function ()
                {
                    await cls.runMiddlewares ("preRequest", ctx);

                    ctx.request = self.buildRequest (ctx);

                    await cls.runMiddlewares ("postRequest", ctx);
                })
                .push (async function (qc)
                {
                    if (ctx.response)
                    {
                        return;
                    }

                    await cls.runMiddlewares ("preRun", ctx);

                    let run = cls[Self.kRun];

                    if (run)
                    {
                        qc.result = await run.call (self, ctx);
                    }
                    else
                    {
                        qc.result = http.responseFor (404);
                    }

                    await cls.runMiddlewares ("postRun", ctx);
                })
                .push (async function (qc)
                {
                    await cls.runMiddlewares ("preResponse", ctx);

                    if (!ctx.response)
                    {
                        ctx.response = qc.result || nit.new ("http.responses.RequestSucceeded");
                    }

                    await cls.runMiddlewares ("postResponse", ctx);
                })
                .success (async function ()
                {
                    await cls.runMiddlewares ("onSuccess", ctx);
                })
                .failure (async function (qc)
                {
                    await cls.runMiddlewares ("onFailure", ctx);

                    throw qc.error;
                })
                .complete (async function ()
                {
                    await cls.runMiddlewares ("onComplete", ctx);
                })
                .run ()
            ;
        })
    ;
};
