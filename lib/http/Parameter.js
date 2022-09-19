module.exports = function (nit, Self)
{
    return (Self = nit.Field.defineSubclass ("http.Parameter"))
        .constant ("SOURCE_TYPES", ["query", "form", "header", "path", "cookie"])
        .m ("error.invalid_source_type", "The source type '%{type}' is invalid.")
        .defaults ("kind", "parameter")
        .property ("source", "string",
        {
            setter: function (v)
            {
                if (v && !Self.SOURCE_TYPES.includes (v))
                {
                    this.throw ("error.invalid_source_type", { type: v });
                }

                return v;
            }
        })
        .property ("sourceName", "string", // The source property name
        {
            getter: function (v)
            {
                return v || this.name;
            }
        })
    ;
};
