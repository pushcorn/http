module.exports = function (nit)
{
    return nit.defineClass ("http.Request")
        .constant ("PRIMARY_PROPERTY_TYPE", "http.Parameter")
        .staticMethod ("parameter", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            nit.new (this.PRIMARY_PROPERTY_TYPE, arguments).bind (this.prototype);

            return this;
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
    ;
};
