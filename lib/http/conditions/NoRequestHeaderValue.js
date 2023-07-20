module.exports = function (nit, http)
{
    return http.defineCondition ("NoRequestHeaderValue")
        .field ("<header>", "string", "The header name.",
        {
            setter: function (v)
            {
                return nit.trim (v).toLowerCase ();
            }
        })
        .field ("<values...>", "string", "The header values.")
        .onCheck (function (ctx)
        {
            return !nit.trim (ctx.req.headers[this.header])
                .split (",")
                .some (v => this.values.includes (v.trim ()))
            ;
        })
    ;
};
