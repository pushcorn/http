module.exports = function (nit, http, Self)
{
    return (Self = http.defineHandler ("http.Api"))
        .m ("error.response_not_allowed", "The response '%{type}' is not allowed.")
        .m ("error.no_default_response", "No response was set for the API '%{name}'.")
        .use ("http.Response")
        .use ("http.responses.ValidationFailed")
        .categorize ("http.apis")
        .defineMeta ("description", "string")
        .defineMeta ("responses...", "function")
        .defineDescriptor ()

        .do ("Context", Context =>
        {
            Context
                .method ("respond", function (resp)
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

                    return this.send (resp);
                })
            ;
        })

        .staticMethod ("info", function (description)
        {
            return this.meta ({ description });
        })
        .staticMethod ("response", function (response) // eslint-disable-line no-unused-vars
        {
            return this.meta ("responses", nit.array (arguments)
                .map (r => nit.lookupComponent (r, "responses", "http.Response"))
            );
        })
        .onPreInit (async function ()
        {
            let self = this;
            let cls = self.constructor;

            if (cls.Request.fields.length && !cls.responses.some (r => nit.is.subclassOf (Self.ValidationFailed, r, true)))
            {
                cls.response (...cls.responses, Self.ValidationFailed);
            }
        })
        .onPostRun (async function (ctx)
        {
            let self = this;
            let cls = self.constructor;
            let responseCls = ctx.response?.constructor;

            if (responseCls
                && cls.responses.length
                && !cls.responses.some (r => r == responseCls))
            {
                self.throw ("error.response_not_allowed", { type: responseCls.name });
            }
        })
        .onPreCatch (async function (ctx)
        {
            if (ctx.error?.code == "error.model_validation_failed")
            {
                ctx.send ("http:validation-failed",
                {
                    violations: ctx.error.context.validationContext.violations.map (v => v.toPojo ())
                });

                ctx.error = null;
            }
        })
    ;
};
