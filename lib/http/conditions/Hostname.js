module.exports = function (nit, http)
{
    return http.defineCondition ("Hostname")
        .field ("<hostnames...>", "string", "The hostnames or patterns.")
        .memo ("patterns", function ()
        {
            return this.hostnames.map (nit.glob.parse);
        })
        .onCheck (function (ctx)
        {
            return this.patterns.some (p => nit.glob (ctx.req.hostname, p));
        })
    ;
};
