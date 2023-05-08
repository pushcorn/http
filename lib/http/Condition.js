module.exports = function (nit)
{
    return nit.defineClass ("http.Condition")
        .categorize ("http.conditions")
        .staticMethod ("onRegisterPlugin", function (hostCls)
        {
            hostCls
                .method ("applicableTo", function (ctx)
                {
                    return this.constructor
                        .getPlugins ("conditions")
                        .every (c => c.check (ctx, this));
                })
            ;
        })
        .abstractMethod ("check", /* istanbul ignore next */ function (ctx, owner) // eslint-disable-line no-unused-vars
        {
            return false;
        })
    ;
};
