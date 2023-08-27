module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.MimeType"))
        .constant ("MIME_TYPES", {})
        .field ("<name>", "string", "The type name.")
        .field ("[extensions...]", "string", "The file extensions.")
        .field ("compressible", "boolean")

        .staticMethod ("register", function (name)
        {
            let mt = new Self (...arguments);

            Self.MIME_TYPES[name] = mt;

            nit.each (mt.extensions, function (ext)
            {
                Self.MIME_TYPES[ext] = mt;
            });
        })
        .staticMethod ("lookup", function (name) // or (extension)
        {
            name = nit.trim (name);

            return Self.MIME_TYPES[name] || Self.MIME_TYPES[name.split (".").pop ()];
        })
        .staticMethod ("lookupName", function (name) // or (extension)
        {
            return Self.lookup (name)?.name;
        })
        .do (function ()
        {
            let data = nit.requireModule ("resources/http/mime-types.json");

            nit.each (data, function (d, name)
            {
                Self.register (name, d);
            });

            Self.register ("application/vnd.nit.template+json");
        })
    ;
};
