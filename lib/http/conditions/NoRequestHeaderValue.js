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
        .method ("check", function (ctx)
        {
            return !nit.trim (ctx.headerParams[this.header])
                .split (",")
                .some (v => this.values.includes (v.trim ()))
            ;
        })
    ;
};
