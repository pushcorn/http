module.exports = function (nit, http)
{
    return http.defineCondition ("ResponseContentType")
        .field ("<types...>", "string", "The content types to check.")
        .property ("matchers...", "http.MimeTypeMatcher")

        .onConstruct (function ()
        {
            this.matchers = this.types.map (t => nit.new ("http.MimeTypeMatcher", t));
        })
        .onCheck (function (ctx)
        {
            return this.matchers.some (m => m.matches (ctx.responseHeader ("Content-Type")));
        })
    ;
};
