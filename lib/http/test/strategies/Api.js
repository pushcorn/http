module.exports = function (nit, Self)
{
    return (Self = nit.test.defineStrategy ("http.test.strategies.Api"))
        .use ("http.Context")
        .field ("<api>", "string", "The API to test.")

        .property ("class", "function")
        .property ("object", "http.Api")
        .property ("context", "http.Context")

        .onConstruct (function (api)
        {
            let cls = nit.lookupComponent (api, "apis", "http.Api");

            this.class = cls;
            this.description = this.description || `API: ${cls.name}`;
        })
        .onTestUp (async function ()
        {
            let cls = this.class;

            this.context = Self.Context.new (cls.requestMethod, cls.requestPath, ...arguments);
            this.object = new cls;
        })
        .onTest (async function ()
        {
            return await this.object.dispatch (this.context);
        })
    ;
};
