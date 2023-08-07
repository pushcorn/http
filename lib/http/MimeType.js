module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.MimeType"))
        .staticMemo ("MIME_TYPES", function ()
        {
            let data = nit.requireModule ("resources/http/mime-types.json");
            let types = {};

            nit.each (data, function (d, name)
            {
                d.name = name;
                types[name] = d;

                nit.each (d.extensions, function (ext)
                {
                    types[ext] = d;
                });
            });

            return types;
        })

        .field ("<name>", "string", "The type name.")
        .field ("[extensions...]", "string", "The file extensions.")
        .field ("compressible", "boolean")

        .staticMethod ("lookup", function (name) // or (extension)
        {
            name = nit.trim (name);

            let mime = Self.MIME_TYPES[name] || Self.MIME_TYPES[name.split (".").pop ()];

            return mime && new Self (mime);
        })
    ;
};
