module.exports = function (nit, http)
{
    return nit.defineClass ("http.tasks.InvokeApi", "nit.Task")
        .field ("<api>", "string|function", "The API to be invoked.")
        .field ("parameters", "any", "The request parameters.", () => ({}))
        .field ("url", "string", "The request URL.", "http://127.0.0.1")
        .field ("port", "integer?", "The server port.")
        .field ("insecure", "boolean", "Whether to ignore invalid certs.")
        .field ("host", "string", "The host header.")
        .onRun (async function ()
        {
            let { api, parameters, url, port, insecure, host } = this;
            let params = {};

            api = nit.lookupComponent (api, "apis");

            api.Request.parameters.forEach (p =>
            {
                let s = p.source || (http.METHODS_WITHOUT_REQUEST_BODY.includes (api.requestMethod) ? "query" : "form");
                let d = params[s] = params[s] || {};
                let v = parameters[p.name];

                d[p.name] = p.primitive ? v : (v instanceof nit.Object ? v.toPojo () : v);
            });

            let reqPath = api.lookupPlugin ("http.conditions.RequestPath");
            let headers = { host: host, "user-agent": `nit client ${http.VERSION}` };

            url = new URL (url);
            url.port = port;
            url.pathname = nit.path.normalize (url.pathname + reqPath.parser.build (params.path));
            url.search = nit.uriEncode (params.query);

            let res = await http.fetch (url.href,
            {
                method: api.requestMethod,
                headers: nit.assign (params.header, headers),
                body: params.form,
                rejectUnauthorized: !insecure
            });

            if (!~~res.headers["content-length"])
            {
                res.destroy ();
            }

            if (res.isText)
            {
                let text = await res.text ();

                res.body = res.isJson ? JSON.parse (text) : text;
            }
            else
            {
                res.body = await res.binary ();
            }

            return nit.pick (res, "statusCode", "statusMessage", "headers", "body", "contentType", "isText", "isJson");
        })
    ;
};
