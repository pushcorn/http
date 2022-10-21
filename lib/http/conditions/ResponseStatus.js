module.exports = function (nit, http)
{
    return http.defineCondition ("ResponseStatus")
        .field ("<codes...>", "string", "The content types to check.")
            .constraint ("type", "integer", "string")
        .property ("patterns...", "RegExp")

        .construct (function ()
        {
            this.patterns = this.codes.map (c => nit.parseRegExp ("^" + nit.trim (c).replace (/x/g, "\\d") + "$"));
        })
        .method ("check", function (ctx)
        {
            return this.patterns.some (p => p.test (ctx.res.statusCode));
        })
    ;
};
