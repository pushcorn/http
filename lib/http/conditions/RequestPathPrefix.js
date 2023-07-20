module.exports = function (nit, http)
{
    return http.defineCondition ("RequestPathPrefix")
        .field ("<prefix>", "string", "The path prefix to check.",
        {
            setter: function (v)
            {
                return "/" + nit.trim (v, "/");
            }
        })
        .method ("check", function (ctx)
        {
            return (ctx.path + "/").startsWith (this.prefix + "/");
        })
    ;
};
