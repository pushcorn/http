module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.ApiSpec"))
        .defineInnerClass ("Spec", false, true, function (Spec)
        {
            Spec
                .staticMethod ("emptyToUndef", function (v)
                {
                    return nit.is.empty (v) ? undefined : v;
                })
                .staticMethod ("field", function ()
                {
                    var cls = Spec.superclass.field.apply (this, arguments);
                    var field = cls.getLastField ();

                    if (field.nullable)
                    {
                        field.setter = Spec.emptyToUndef;
                    }

                    return cls;
                })
                .method ("toJson", function (indent)
                {
                    return nit.toJson (this.toPojo (), indent);
                })
            ;
        })
        .defineSpec ("Constraint", function (Constraint)
        {
            Constraint
                .constant ("PROPERTIES_TO_IGNORE", nit.keys (nit.Constraint.propertyMap))
                .field ("<type>", "string")
                .field ("[code]", "string")
                .field ("[message]", "string")
                .field ("name", "string?")
                .field ("condition", "string?")
                .field ("options", "object?")
            ;
        })
        .defineSpec ("Parameter", function (Parameter)
        {
            Parameter
                .field ("<spec>", "string")
                .field ("[type]", "string?")
                .field ("[description]", "string?")
                .field ("[defval]", "any?")
                .field ("label", "string?")
                .field ("source", "string?")
                .field ("constraints...", Self.Constraint.name + "?")
            ;
        })
        .defineSpec ("Field", function (Field)
        {
            Field
                .field ("<spec>", "string")
                .field ("[type]", "string?")
                .field ("[description]", "string?")
                .field ("[defval]", "any?")
                .field ("constraints...", Self.Constraint.name + "?")
            ;
        })
        .defineSpec ("Response", function (Response)
        {
            Response
                .field ("<name>", "string", "The response name.")
                .field ("[status]", "integer", "The response status code.")
                .field ("[message]", "string", "The response status message.")
                .field ("[code]", "string?", "The error code that the response represents.")
                .field ("fields...", Self.Field.name + "?", "The response fields.")
            ;
        })
        .defineSpec ("Model", function (Model)
        {
            Model
                .field ("<name>", "string", "The model name.")
                .field ("fields...", Self.Field.name + "?", "The model fields.")
            ;
        })
        .defineSpec ("Request", function (Request)
        {
            Request
                .field ("parameters...", Self.Parameter.name + "?")
            ;
        })
        .defineSpec ("Api", function (Api)
        {
            Api
                .field ("<name>", "string")
                .field ("[method]", "string?")
                .field ("[path]", "string?")
                .field ("[description]", "string?")
                .field ("request", Self.Request.name)
                .field ("responses...", "string?")
            ;
        })
        .field ("apis...", Self.Api.name)
        .field ("responses...", Self.Response.name)
        .field ("models...", Self.Model.name)

        .method ("toJson", function (indent)
        {
            return nit.toJson (this.toPojo (), indent);
        })
    ;
};
