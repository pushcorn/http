module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.ApiSpec"))
        .m ("error.endpoint_conflict", "The API endpoint '%{endpoint}' of '%{api}' has been used by the '%{owner}'.")
        .defineInnerClass ("Spec", false, true, function (Spec)
        {
            Spec
                .staticMethod ("emptyToUndef", function (v)
                {
                    return nit.is.empty.nested (nit.toPojo (v)) ? undefined : v;
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
            ;
        })
        .defineSpec ("Constraint", function (Constraint)
        {
            Constraint
                .field ("<type>", "string")
                .field ("[code]", "string")
                .field ("[message]", "string")
                .field ("name", "string?")
                .field ("condition", "string?")
                .field ("options", "object?")
                .property ("owner", Self.name + ".Field|" + Self.name + ".Parameter")
            ;
        })
        .defineSpec ("Parameter", function (Parameter)
        {
            Parameter
                .field ("<spec>", "string")
                .field ("[type]", "string?")
                .field ("[description]", "string?")
                .field ("[defval]", "any")
                .field ("label", "string?")
                .field ("source", "string?")
                .field ("constraints...", Self.Constraint.name + "?", { backref: "owner" })
                .property ("request", Self.name + ".Request")
            ;
        })
        .defineSpec ("Field", function (Field)
        {
            Field
                .field ("<spec>", "string")
                .field ("[type]", "string?")
                .field ("[description]", "string?")
                .field ("[defval]", "any")
                .field ("constraints...", Self.Constraint.name + "?", { backref: "owner" })
                .property ("owner", Self.name + ".Response|" + Self.name + ".Model")
            ;
        })
        .defineSpec ("Response", function (Response)
        {
            Response
                .field ("<name>", "string", "The response name.")
                .field ("<status>", "integer", "The response status code.")
                .field ("[message]", "string?", "The response status message.")
                .field ("[code]", "string?", "The error code that the response represents.")
                .field ("fields...", Self.Field.name + "?", "The response fields.", { backref: "owner" })
                .property ("spec", Self.name)
            ;
        })
        .defineSpec ("Model", function (Model)
        {
            Model
                .field ("<name>", "string", "The model name.")
                .field ("fields...", Self.Field.name + "?", "The model fields.", { backref: "owner" })
                .property ("spec", Self.name)
            ;
        })
        .defineSpec ("Request", function (Request)
        {
            Request
                .field ("parameters...", Self.Parameter.name + "?", { backref: "request" })
                .property ("api", Self.name + ".Api")
            ;
        })
        .defineSpec ("Api", function (Api)
        {
            Api
                .field ("<name>", "string")
                .field ("[requestMethod]", "string?")
                .field ("[requestPath]", "string?")
                .field ("[description]", "string?")
                .field ("request", Self.Request.name + "?", { backref: "api" })
                .field ("responses...", "string?")
                .property ("spec", Self.name)
            ;
        })
        .field ("apis...", Self.Api.name,
        {
            backref: "spec",
            deferred: true,
            onLink: function (api)
            {
                var self = this;

                self.apis.forEach (function (a)
                {
                    var ma = nit.coalesce (a.requestMethod, "GET");
                    var mb = nit.coalesce (api.requestMethod, "GET");
                    var pa = nit.coalesce (a.requestPath, "/");
                    var pb = nit.coalesce (api.requestPath, "/");

                    if (pa == pb && ma == mb && a.name != api.name)
                    {
                        self.throw ("error.endpoint_conflict", { endpoint: ma + " " + pa, api: api.name, owner: a.name });
                    }
                });
            }
        })
        .field ("responses...", Self.Response.name, { backref: "spec", deferred: true })
        .field ("models...", Self.Model.name, { backref: "spec", deferred: true })

        .method ("sort", function ()
        {
            var self = this;
            var keys = ["apis", "responses", "models"];

            nit.each (keys, function (p)
            {
                self[p] = nit.arrayUnique (self[p], function (a, b) { return a.name == b.name; });
            });

            nit.each (keys, function (p)
            {
                var arr = self[p];

                arr.forEach (function (a) { a._name = nit.kababCase (a.name); });
                arr.sort (function (a, b) { return nit.sort.COMPARATORS.string (a._name, b._name); });
                arr.forEach (function (a) { delete a._name; });
            });

            return self;
        })
    ;
};
