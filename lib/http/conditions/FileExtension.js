module.exports = function (nit, http, Self)
{
    return (Self = http.defineCondition ("FileExtension"))
        .use ("http.utils.ExtensionMatcher")
        .field ("<extensions...>", "string", "The file extensions.")
        .memo ("matcher", function ()
        {
            return new Self.ExtensionMatcher (...this.extensions);
        })
        .onCheck (function (ctx)
        {
            return this.matcher.match (ctx.path);
        })
    ;
};
