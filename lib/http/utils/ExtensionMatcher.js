module.exports = function (nit)
{
    return nit.defineClass ("http.utils.ExtensionMatcher")
        .field ("[extensions...]", "string", "The file extensions.",
        {
            caster: function (v)
            {
                v = nit.trim (v);

                return (v[0] != "." ? ("." + v) : v).toLowerCase ();
            }
        })
        .method ("match", function (name)
        {
            name = nit.trim (name).toLowerCase ();

            return !this.extensions.length || this.extensions.some (ext => name.endsWith (ext));
        })
    ;
};
