module.exports = function (nit, Self)
{
    return (Self = nit.defineModel ("http.Request"))
        .constant ("PRIMARY_PROPERTY_TYPE", "http.Request.Parameter")
        .constant ("PARAMETER_SOURCES", ["query", "form", "header", "path", "cookie"])
        .staticGetter ("parameters", "properties")
        .staticGetter ("parameterMap", "propertyMap")

        .defineInnerClass ("Parameter", "nit.Model.Field", function (Parameter)
        {
            Parameter
                .defaults ("kind", "parameter")
                .property ("label", "string")
                .property ("source", "string",
                {
                    constraints: nit.new ("constraints.Choice", Self.PARAMETER_SOURCES)
                })
                .property ("sourceName", "string", // The source property name
                {
                    getter: function (v)
                    {
                        return v || this.name;
                    }
                })
            ;
        })

        .staticMethod ("parameter", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var cls = this;

            nit.new (Self.Parameter, arguments).bind (cls.prototype);

            return cls.validatePropertyDeclarations ();
        })
        .do (function ()
        {
            Self.PARAMETER_SOURCES.forEach (function (source)
            {
                Self.staticMethod (source, function (spec, type, description, defval) // eslint-disable-line no-unused-vars
                {
                    return this.parameter.apply (this, nit.array (arguments).concat ({ source: source }));
                });
            });
        })
    ;
};
