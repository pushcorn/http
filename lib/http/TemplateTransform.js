module.exports = function (nit)
{
    return nit.defineClass ("http.TemplateTransform")
        .categorize ("http.templatetransforms")
        .mixin ("http:describable")
        .defineInstanceDescriptor ()
        .lifecycleMethod ("transform", null, /* istanbul ignore next */ function (ctx /*, ...args */) // eslint-disable-line no-unused-vars
        {
        })
    ;
};
