module.exports = function (nit)
{
    return nit.defineClass ("http.Request")
        .constant ("PRIMARY_PROPERTY_TYPE", "http.Parameter")
        .staticMethod ("parameter", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var cls = this;

            nit.new ("http.Parameter", arguments).bind (cls.prototype);

            return cls.validatePropertyDeclarations (cls.getProperties ());
        })
        .staticMethod ("header", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            return this.parameter (...nit.array (arguments).concat ({ source: "header" }));
        })
        .staticMethod ("path", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            return this.parameter (...nit.array (arguments).concat ({ source: "path" }));
        })
        .staticMethod ("cookie", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            return this.parameter (...nit.array (arguments).concat ({ source: "cookie" }));
        })
        .staticMethod ("form", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            return this.parameter (...nit.array (arguments).concat ({ source: "form" }));
        })
        .staticMethod ("query", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            return this.parameter (...nit.array (arguments).concat ({ source: "query" }));
        })
        .staticMethod ("build", function (ctx) // should be invoked by ctx.readRequest ()
        {
            let cls = this;
            let allParams = nit.assign ({}, ctx.queryParams, ctx.formParams, ctx.pathParams, ctx.cookieParams, ctx.headerParams);
            let params = {};

            cls.getProperties ()
                .forEach (p =>
                {
                    if (p.source)
                    {
                        params[p.name] = nit.get (ctx, p.source + "Params." + p.sourceName);
                    }
                    else
                    {
                        params[p.name] = allParams[p.name];
                    }
                })
            ;

            return new cls (params);
        })
    ;
};
