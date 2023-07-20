module.exports = function (nit, http)
{
    return http.defineCondition ("RequestMethod")
        .field ("<method>", "string", "The request method to check.")
        .onCheck (function (ctx)
        {
            return this.method == ctx.method;
        })
    ;
};
