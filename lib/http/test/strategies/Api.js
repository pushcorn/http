module.exports = function (nit, Self)
{
    return (Self = nit.test.defineStrategy ("http.test.strategies.Api"))
        .use ("http.Context")
        .field ("<api>", "string", "The API to test.")
        .field ("[endpoint]", "string", "The endpoint to use.")

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
            let endpoint = this.endpoint || (cls.requestMethod + " " + cls.requestPath);
            let [requestMethod, requestPath] = nit.kvSplit (endpoint);

            this.context = Self.Context.new (requestMethod, requestPath, ...arguments);
            this.object = new cls;
        })
        .onTestBefore (function ()
        {
            this.object.applicableTo (this.context);
        })
        .onTest (async function ()
        {
            return await this.object.dispatch (this.context);
        })
    ;
};
