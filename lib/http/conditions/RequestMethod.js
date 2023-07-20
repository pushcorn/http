module.exports = function (nit, http)
{
    return http.defineCondition ("RequestMethod")
        .field ("<method>", "string", "The request method to check.")
        .method ("check", function (ctx)
        {
            return this.method == ctx.method;
        })
    ;
};
