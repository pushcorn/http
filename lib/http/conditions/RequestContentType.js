module.exports = function (nit, http)
{
    return http.defineCondition ("RequestContentType")
        .field ("<types...>", "string", "The content types to check.")
        .property ("matchers...", "http.utils.MimeTypeMatcher")

        .onConstruct (function ()
        {
            this.matchers = this.types.map (t => nit.new ("http.utils.MimeTypeMatcher", t));
        })
        .onCheck (function (ctx)
        {
            return this.matchers.some (m => m.matches (ctx.req.contentType));
        })
    ;
};
