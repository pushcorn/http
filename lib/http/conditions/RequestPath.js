module.exports = function (nit, http)
{
    return http.defineCondition ("RequestPath")
        .field ("<path>", "string", "The request path to check.")
        .property ("parser", "http.PathParser")

        .onConstruct (function ()
        {
            this.parser = nit.new ("http.PathParser", this.path);
        })
        .onCheck (function (ctx)
        {
            let params = this.parser.parse (ctx.path);

            return !!(params && (ctx.pathParams = params));
        })
    ;
};
