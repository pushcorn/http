module.exports = function (nit, http)
{
    return http.defineCondition ("NoResponseHeader")
        .field ("<names...>", "string", "The header names.")
        .onCheck (function (ctx)
        {
            return !this.names.some (n => ctx.responseHeader (n));
        })
    ;
};
