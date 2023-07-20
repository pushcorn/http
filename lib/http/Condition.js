module.exports = function (nit)
{
    return nit.defineClass ("http.Condition")
        .mixin ("http:describable")
        .categorize ("http.conditions")
        .defineInstanceDescriptor ()
        .staticMethod ("onRegisterPlugin", function (hostCls)
        {
            hostCls
                .method ("applicableTo", function (ctx)
                {
                    let seen = {};

                    return this.constructor
                        .getPlugins ("conditions")
                        .filter (c =>
                        {
                            let cn = c.constructor.name;

                            return seen[cn] ? false : (seen[cn] = true);
                        })
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
