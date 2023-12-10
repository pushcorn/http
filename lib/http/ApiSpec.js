module.exports = function (nit, http, Self)
{
    return (Self = nit.requireAsset ("public/lib/http/ApiSpec"))
        .use ("http.conditions.RequestPath")
        .use ("http.conditions.RequestMethod")
        .do ("Constraint", Constraint =>
        {
            Constraint
                .constant ("PROPERTIES_TO_IGNORE", nit.keys (nit.Constraint.propertyMap))
                .defineCaster (function (constraint)
                {
                    if (constraint instanceof nit.Constraint)
                    {
                        let cls = constraint.constructor;

                        constraint = nit.assign (new Constraint (cls.componentName, constraint.code, constraint.message),
                        {
                            name: constraint.name == cls.componentName ? undefined : constraint.name,
                            condition: constraint.condition,
                            options: nit.omit (nit.pick (constraint, cls.enumerablePropertyNames), Constraint.PROPERTIES_TO_IGNORE)

                        }, nit.is.not.empty);
                    }

                    return constraint;
                })
            ;
        })
        .do ("Parameter", Parameter =>
        {
            Parameter
                .constant ("EXPORTABLE_PROPERTIES", ["spec", "type", "description", "defval", "label", "source"])
                .defineCaster (function (parameter)
                {
                    if (parameter instanceof http.Api.Request.Parameter)
                    {
                        let request = this;

                        parameter = nit.assign (new Parameter (Self.exportProperty (request.api.spec, parameter, Parameter.EXPORTABLE_PROPERTIES)),
                        {
                            request,
                            constraints: parameter.constraints
                        });
                    }

                    return parameter;
                })
            ;
        })
        .do ("Field", Field =>
        {
            Field
                .constant ("EXPORTABLE_PROPERTIES", ["spec", "type", "description", "defval"])
                .defineCaster (function (field)
                {
                    if (field instanceof nit.Field)
                    {
                        let owner = this;

                        field = nit.assign (new Field (Self.exportProperty (owner.spec, field, Field.EXPORTABLE_PROPERTIES)),
                        {
                            owner,
                            constraints: field.constraints
                        });
                    }

                    return field;
                })
            ;
        })
        .do ("Response", Response =>
        {
            Response
                .defineCaster (function (response)
                {
                    if (nit.is.func (response) && nit.is.subclassOf (response, http.Response))
                    {
                        let spec = this;

                        response = nit.assign (new Response (response.name, response.status),
                        {
                            message: response.message,
                            code: response.code,
                            spec,
                            fields: response.enumerableProperties
                        });
                    }

                    return response;
                })
            ;
        })
        .do ("Model", Model =>
        {
            Model
                .defineCaster (function (model)
                {
                    if (nit.is.func (model))
                    {
                        let spec = this;

                        model = nit.assign (new Model (model.name),
                        {
                            spec,
                            fields: model.enumerableProperties
                        });
                    }

                    return model;
                })
            ;
        })
        .do ("Request", Request =>
        {
            Request
                .defineCaster (function (request)
                {
                    if (nit.is.func (request) && nit.is.subclassOf (request, http.Request))
                    {
                        request = nit.assign (new Request,
                        {
                            api: this,
                            parameters: request.enumerableProperties
                        });
                    }

                    return request;
                })
            ;
        })
        .do ("Api", Api =>
        {
            Api
                .defineCaster (function (api)
                {
                    if (api instanceof http.Api)
                    {
                        let spec = this;
                        let apiClass = api.constructor;

                        api = nit.assign (new Api (
                        {
                            name: apiClass.name,
                            description: apiClass.description,
                            requestMethod: apiClass.getPlugins.call (api, "conditions").find (c => c instanceof Self.RequestMethod)?.method,
                            requestPath: apiClass.getPlugins.call (api, "conditions").find (c => c instanceof Self.RequestPath)?.path
                        })
                        ,
                        {
                            spec,
                            request: apiClass.Request,
                            responses: apiClass.responses.map (r => (spec.responses.push (r) && r.name))
                        });
                    }

                    return api;
                })
            ;
        })
        .staticMethod ("exportProperty", function (spec, prop, exportableProperties)
        {
            let p = nit.pick (prop, exportableProperties);

            if (prop.class)
            {
                spec.models.push (prop.class);

                p.type = prop.class.name;
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

            return p;
        })
    ;
};
