module.exports = function (nit)
{
    return nit.definePlugin ("http.Condition")
        .categorize ("http.conditions")
        .onRegisteredBy (function (hostCls)
        {
            hostCls
                .method ("applicableTo", function (ctx)
                {
                    let self = this;

                    return self.constructor
                        .getPlugins.call (self, "conditions")
                        .every (c => c.check (ctx, self));
                })
            ;
        })
        .lifecycleMethod ("check", true) // onCheck (ctx, host)
    ;
};
