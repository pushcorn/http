module.exports = function (nit, http, Self)
{
    return (Self = nit.definePlugin ("http.plugins.HandlerAdapter"))
        .use ("http.Handler")
        .m ("error.invalid_host_class", "The host class is not a subclass of http.Handler.")
        .onUsedBy (function (hostClass)
        {
            let plugin = this;

            if (!nit.is.subclassOf (hostClass, Self.Handler))
            {
                plugin.throw ("error.invalid_host_class");
            }

            hostClass
                .lifecycleMethod ("runTarget", true) // (ctx) => <result>
                .lifecycleMethod ("sendResult", async function (result, ctx)
                {
                    let self = this;
                    let cls = self.constructor;

                    await cls[cls.kSendResult]?. (result, ctx);

                    if (!ctx.response)
                    {
                        if (nit.is.str (result))
                        {
                            ctx.sendText (result);
                        }
                        else
                        {
                            ctx.sendJson (result);
                        }
                    }
                })
                .staticMethod ("buildRequest", function (parameters, builder)
                {
                    let cls = this;
                    let Request = cls.Request.importProperties (parameters);

                    builder?.call (cls, Request);

                    let rpPlugin = cls.lookupPlugin ("http.conditions.RequestPath");

                    Request.parameters
                        .forEach (p =>
                        {
                            p.source = rpPlugin.parser.params.includes (p.name)
                                ? "path"
                                : (http.METHODS_WITHOUT_REQUEST_BODY.includes (cls.requestMethod) ? "query" : "form")
                            ;
                        })
                    ;

                    return cls;
                })
                .onConfigureQueueForRun (function (queue, handler, [ctx])
                {
                    queue.after ("run.invokeHook", "run.runTarget", async function ()
                    {
                        let result = await handler.runTarget (ctx);

                        handler.sendResult (result, ctx);
                    });
                })
                .do (!hostClass.requestMethod, () =>
                {
                    hostClass.endpoint ("POST");
                })
            ;
        })
    ;
};
