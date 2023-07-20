module.exports = function (nit)
{
    return nit.defineClass ("http.ApiPlugin")
        .categorize ("http.apiplugins")
        .mixin ("http:describable")
        .defineInstanceDescriptor ()
        .lifecycleMethod ("preRun", null, /* istanbul ignore next */ function (ctx, api) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postRun", null, /* istanbul ignore next */ function (ctx, api) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preCatch", null, /* istanbul ignore next */ function (ctx, api) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postCatch", null, /* istanbul ignore next */ function (ctx, api) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preFinally", null, /* istanbul ignore next */ function (ctx, api) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postFinally", null, /* istanbul ignore next */ function (ctx, api) {}) // eslint-disable-line no-unused-vars
    ;
};
