module.exports = function (nit)
{
    return nit.definePlugin ("http.plugins.LogForwarder")
        .field ("[target]", "string", "The property to access the target object which is resposible for logging.", "server")
        .staticMethod ("onUsePlugin", function (hostCls, plugin)
        {
            hostCls
                .do (function ()
                {
                    nit.log.LEVELS.forEach (level =>
                    {
                        hostCls.method (level, function (message, ...args)
                        {
                            let self = this;

                            message = typeof message == "string" ? self.constructor.t (message) : message;

                            nit.get (self, plugin.target)?.[level]?. (message, ...args);
                        });
                    });
                })
            ;
        })
    ;
};
