module.exports = function (nit, http)
{
    return http.defineCondition ("ResponseStatus")
        .field ("<codes...>", "integer|string", "The content types to check.")
        .property ("patterns...", "RegExp")

        .onConstruct (function ()
        {
            this.patterns = this.codes.map (c => nit.parseRegExp ("^" + nit.trim (c).replace (/x/g, "\\d") + "$"));
        })
        .onCheck (function (ctx)
        {
            return this.patterns.some (p => p.test (ctx.res.statusCode));
        })
    ;
};
