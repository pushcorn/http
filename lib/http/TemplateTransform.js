module.exports = function (nit)
{
    return nit.defineClass ("http.TemplateTransform")
        .categorize ("http.templatetransforms")
        .defineCaster ("component")
        .lifecycleMethod ("transform", true) // (ctx /*, ...args */)
    ;
};
