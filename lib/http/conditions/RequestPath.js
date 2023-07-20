module.exports = function (nit, http)
{
    return http.defineCondition ("RequestPath")
        .field ("<path>", "string", "The request path to check.")
        .property ("parser", "http.PathParser")

        .onConstruct (function ()
        {
            this.parser = nit.new ("http.PathParser", this.path);
        })
        .method ("check", function (ctx)
        {
            return !!(this.parser.parse (ctx.path) && (ctx.pathParser = this.parser));
        })
    ;
};
