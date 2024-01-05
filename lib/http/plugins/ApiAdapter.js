module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("http.plugins.ApiAdapter"))
        .m ("error.invalid_host_class", "The host class is not a subclass of http.Api.")
        .use ("http.Api")
        .use ("http.responses.ValidationFailed")
        .onUsedBy (function (hostClass)
        {
            if (!nit.is.subclassOf (hostClass, Self.Api))
            {
                this.throw ("error.invalid_host_class");
            }

            hostClass
                .plugin ("http:handler-adapter")
                .configureComponentMethod ("dispatch", Method =>
                {
                    Method
                        .replace ("dispatch.sendTargetResult", function (api, ctx)
                        {
                            let cls = api.constructor;
                            let result = this.result;

                            if (!nit.is.undef (result) && !cls.responses.filter (r => r != Self.ValidationFailed).length)
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
            ;
        })
    ;
};
