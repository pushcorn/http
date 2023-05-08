module.exports = function (nit, http)
{
    return http.defineCondition ("Hostname")
        .field ("<hostnames...>", "string", "The hostnames or patterns.")
        .memo ("patterns", function ()
        {
            return nit.each (this.hostnames, n =>
            {
                if (n == "*")
                {
                    return /.*/;
                }
                else
                if (~n.indexOf ("*"))
                {
                    return new RegExp ("^" + n.replace (/\./g, "[.]").replace (/\*/g, "[^.]+") + "$", "i");
                }
                else
                if (n[0] == "~")
                {
                    return nit.parseRegExp (n.slice (1));
                }
                else
                {
                    return new RegExp ("^" + nit.escapeRegExp (n) + "$", "i");
                }
            });
        })
        .method ("check", function (ctx)
        {
            return this.patterns.some (p => ctx.req.hostname.match (p));
        })
    ;
};
