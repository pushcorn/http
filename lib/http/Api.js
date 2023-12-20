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
        .defineComponentPlugin ()
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
        .staticMethod ("describe", function (description, ...responses)
        {
            let cls = this;

            return cls
                .meta ({ description })
                .response (...cls.responses, ...responses)
            ;
        })
        .staticMethod ("defineResponse", function (name, builder)
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
        .configureComponentMethod ("run", Queue =>
        {
            Queue.after ("run.invokeHook", "run.sendHookResult", function (api, ctx)
            {
                let cls = api.constructor;

                if (!nit.is.undef (this.result) && cls.responses.filter (r => r != Self.ValidationFailed).length)
                {
                    ctx.respond (this.result);
                }
            });
        })
        .configureComponentMethod ("finally", Queue =>
        {
            Queue.after ("preAll", "preAll.validateResponseType", function (api, ctx)
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
        .configureComponentMethod ("catch", Queue =>
        {
            Queue.after ("preAll", "preAll.castSupportedError", function (api, ctx)
            {
                let cls = api.constructor;
                let code;
                let resClass;

                if (nit.is.int (ctx.error) && (resClass = cls.responses.find (r => r.status == ctx.error)))
                {
                    ctx.send (new resClass);
                }
                else
                if ((code = ctx.error?.code))
                {
                    if (code == "error.model_validation_failed")
                    {
                        ctx.send ("http:validation-failed",
                        {
                            violations: ctx.error.context.validationContext.violations.map (v => v.toPojo ())
                        });
                    }
                    else
                    if ((resClass = cls.responses.find (r => r.code == code)))
                    {
                        ctx.send (new resClass);
                    }
                }
            });
        })
        .onPostNsInvoke (function ()
        {
            let cls = this;

            if (cls != Self
                && cls.Request.fields.length
                && !cls.responses.some (r => nit.is.subclassOf (Self.ValidationFailed, r, true)))
            {
                cls.response (...cls.responses, Self.ValidationFailed);
            }
        })
    ;
};
