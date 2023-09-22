module.exports = function (nit, http, Self)
{
    return (Self = nit.requireAsset ("public/lib/http/ApiSpec"))
        .use ("http.conditions.RequestPath")
        .use ("http.conditions.RequestMethod")

        .do ("Constraint", Constraint =>
        {
            Constraint
                .staticMethod ("import", function (owner, constraint)
                {
                    let cls = constraint.constructor;
                    let cfg = constraint.toPojo ();

                    if (cfg.name == cls.componentName) { delete cfg.name; }

                    cfg.options = nit.omit (cfg, Constraint.PROPERTIES_TO_IGNORE);
                    cfg.type = cls.componentName;

                    return new Constraint (cfg);
                })
            ;
        })
        .do ("Parameter", Parameter =>
        {
            Parameter
                .constant ("PROPERTIES_TO_IMPORT", ["spec", "type", "description", "defval", "label", "source"])
                .staticMethod ("import", function (owner, parameter)
                {
                    return Self.importProperty (owner, parameter, Parameter);
                })
            ;
        })
        .do ("Field", Field =>
        {
            Field
                .constant ("PROPERTIES_TO_IMPORT", ["spec", "type", "description", "defval"])
                .staticMethod ("import", function (owner, field)
                {
                    return Self.importProperty (owner, field, Field);
                })
            ;
        })
        .do ("Response", Response =>
        {
            Response
                .staticMethod ("import", function (owner, respClass)
                {
                    owner.responses.push (
                    {
                        name: respClass.simpleName,
                        status: respClass.status,
                        message: respClass.message,
                        code: respClass.code,
                        fields: respClass.fields.map (f => Self.Field.import (owner, f))
                    });
                })
            ;
        })
        .do ("Model", Model =>
        {
            Model
                .staticMethod ("import", function (owner, modelClass)
                {
                    owner.models.push (
                    {
                        name: modelClass.simpleName,
                        fields: modelClass.fields.map (f => Self.Field.import (owner, f))
                    });
                })
            ;
        })
        .do ("Request", Request =>
        {
            Request
                .staticMethod ("import", function (owner, reqClass)
                {
                    return !reqClass.parameters.length ? null : new Request (
                    {
                        parameters: reqClass.parameters.map (p => Self.Parameter.import (owner, p))
                    });
                })
            ;
        })
        .do ("Api", Api =>
        {
            Api
                .staticMethod ("import", function (owner, apiClass)
                {
                    owner.apis.push (
                    {
                        name: apiClass.simpleName,
                        description: apiClass.description,
                        method: apiClass.getPlugins ("conditions").find (c => c instanceof Self.RequestMethod)?.method,
                        path: apiClass.getPlugins ("conditions").find (c => c instanceof Self.RequestPath)?.path,
                        request: Self.Request.import (owner, apiClass.Request),
                        responses: apiClass.responses.map (r => Self.Response.import (owner, r) || r.simpleName)
                    });
                })
            ;
        })

        .staticMethod ("importProperty", function (owner, prop, propType)
        {
            let p = new propType (nit.pick (prop, propType.PROPERTIES_TO_IMPORT));

            if (prop.class)
            {
                Self.Model.import (owner, prop.class);

                p.type = prop.class.simpleName;
            }

            if (prop.emptyAllowed)
            {
                p.type += "*";
            }
            else
            if (prop.nullable)
            {
                p.type += "?";
            }

            if (p.defval == prop.parser.defval)
            {
                p.defval = undefined;
            }

            p.constraints = prop.constraints.map (c => Self.Constraint.import (owner, c));

            return p;
        })
        .method ("sortItems", function ()
        {
            let self = this;
            let keys = ["apis", "responses", "models"];

            nit.each (keys, (p) =>
            {
                self[p] = nit.arrayUnique (self[p], (a, b) => a.name == b.name);
            });

            nit.each (keys, function (p)
            {
                let arr = self[p];

                arr.forEach (a => a._name = nit.kababCase (a.name));
                arr.sort ((a, b) => nit.sort.COMPARATORS.string (a._name, b._name));
                arr.forEach (a => delete a._name);
            });

            return self;
        })
        .method ("import", function (apiClass)
        {
            let self = this;

            Self.Api.import (self, apiClass);

            return self.sortItems ();
        })
    ;
};
