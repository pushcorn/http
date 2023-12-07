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
                .onSendResult (function (result, ctx)
                {
                    let cls = this.constructor;

                    if (cls.responses.filter (r => r != Self.ValidationFailed).length)
                    {
                        ctx.respond (result);
                    }
                })
            ;
        })
    ;
};
