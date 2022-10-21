module.exports = function (nit, http)
{
    return http.defineCondition ("NoResponseHeader")
        .field ("<names...>", "string", "The header names.")
        .method ("check", function (ctx)
        {
            return !this.names.some (n => ctx.responseHeader (n));
        })
    ;
};
