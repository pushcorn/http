module.exports = function (nit, http, Self)
{
    return (Self = nit.definePlugin ("http.plugins.HandlerAdapter"))
        .use ("http.Handler")
        .meta ("replace", false)
        .m ("error.invalid_host_class", "The host class is not a subclass of http.Handler.")
        .onUsedBy (function (hostClass)
        {
            let plugin = this;

            if (!nit.is.subclassOf (hostClass, Self.Handler))
            {
                plugin.throw ("error.invalid_host_class");
            }

            hostClass
                .k ("runTarget", "sendTargetResult")
                .lifecycleMethod ("runTarget", true) // (ctx) => <result>
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
                .configureComponentMethod ("dispatch", Method =>
                {
                    Method
                        .after ("dispatch.invokeHook", hostClass.kRunTarget, (handler, ctx) => handler.runTarget (ctx))
                        .after (hostClass.kRunTarget, hostClass.kSendTargetResult, function (handler, ctx)
                        {
                            let result = this.result;

                            if (!nit.is.undef (result))
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
                    ;
                })
                .do (!hostClass.requestMethod, () =>
                {
                    hostClass.endpoint ("POST");
                })
            ;
        })
    ;
};
