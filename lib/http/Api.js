module.exports = function (nit, http, Self)
{
    return (Self = http.defineHandler ("http.Api"))
        .m ("error.response_not_allowed", "The response '%{type}' is not allowed.")
        .m ("error.no_default_response", "No response was set for the API '%{name}'.")
        .use ("http.Response")
        .use ("http.responses.ValidationFailed")
        .plugin ("compgen-completer")
        .categorize ("http.apis")
        .defineMeta ("description", "string", "Description not available.")
        .defineMeta ("responses...", "function")
        .registerStringTypeParser ("api")
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForType ("api", ctx => [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (nit.listComponents ("apis").map (d => d.name))])
            ;
        })

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
        .staticMethod ("defineRespone", function (name, builder)
        {
            let cls = this;

            return cls.defineInnerClass (name, "http.Response", builder)
                .response (...cls.responses, cls.name + "." + name)
            ;
        })
        .staticMethod ("response", function (response) // eslint-disable-line no-unused-vars
        {
            return this.meta ("responses", nit.array (arguments)
                .map (r => nit.lookupComponent (r, "responses", "http.Response"))
            );
        })
        .onConfigureQueueForPreInit (function (queue, api)
        {
            queue.lpush ("preInit.addValidationFailedResponse", function ()
            {
                let cls = api.constructor;

                if (cls.Request.fields.length && !cls.responses.some (r => nit.is.subclassOf (Self.ValidationFailed, r, true)))
                {
                    cls.response (...cls.responses, Self.ValidationFailed);
                }
            });
        })
        .onConfigureQueueForFinally (function (queue, api, [ctx])
        {
            queue.after ("preFinally", "postRun.validateResponseType", function ()
            {
                let cls = api.constructor;
                let responseCls = ctx.response?.constructor;

                if (responseCls
                    && cls.responses.filter (r => r != Self.ValidationFailed).length
                    && !cls.responses.some (r => r == responseCls))
                {
                    api.throw ("error.response_not_allowed", { type: responseCls.name });
                }
            });
        })
        .onConfigureQueueForCatch (function (queue, api, [ctx])
        {
            queue.after ("preCatch", "preCatch.castSupportedError", function ()
            {
                let cls = api.constructor;
                let code = ctx.error?.code;
                let resClass;

                if (code == "error.model_validation_failed")
                {
                    ctx.send ("http:validation-failed",
                    {
                        violations: ctx.error.context.validationContext.violations.map (v => v.toPojo ())
                    });

                    ctx.error = null;
                }
                else
                if (code && (resClass = cls.responses.find (r => r.code == code)))
                {
                    ctx.send (new resClass);

                    ctx.error = null;
                }
            });
        })
    ;
};
