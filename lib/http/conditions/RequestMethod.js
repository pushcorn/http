module.exports = function (nit, http)
{
    return http.defineCondition ("RequestMethod")
        .field ("<methods...>", "string", "The content methods to check.")
        .method ("check", function (ctx)
        {
            return this.methods.some (m => m == ctx.method);
        })
    ;
};
