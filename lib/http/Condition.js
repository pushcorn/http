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
                    return this.constructor
                        .getPlugins ("conditions", true)
                        .every (c => c.check (ctx, this));
                })
            ;
        })
        .lifecycleMethod ("check", null, true) // onCheck (ctx, target)
    ;
};
