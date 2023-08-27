module.exports = function (nit)
{
    return nit.defineClass ("http.HandlerPlugin")
        .categorize ("http.handlerplugins")
        .mixin ("http:describable")
        .defineInstanceDescriptor ()
        .lifecycleMethod ("preRun", null, /* istanbul ignore next */ function (ctx, handler) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postRun", null, /* istanbul ignore next */ function (ctx, handler) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preCatch", null, /* istanbul ignore next */ function (ctx, handler) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postCatch", null, /* istanbul ignore next */ function (ctx, handler) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preFinalize", null, /* istanbul ignore next */ function (ctx, handler) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postFinalize", null, /* istanbul ignore next */ function (ctx, handler) {}) // eslint-disable-line no-unused-vars
    ;
};