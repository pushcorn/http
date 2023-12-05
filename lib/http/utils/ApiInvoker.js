module.exports = function (nit, http)
{
    return nit.defineClass ("http.utils.ApiInvoker")
        .field ("<api>", "string|function", "The API to be invoked.")
        .field ("parameters", "any", "The request parameters.", () => ({}))
        .field ("url", "string", "The request URL.", "http://127.0.0.1")
        .field ("port", "integer?", "The server port.")
        .field ("silent", "boolean", "Whether to print the response headers.")
        .field ("insecure", "boolean", "Whether to ignore invalid certs.")
        .field ("host", "string", "The host header.")
        .method ("invoke", async function ()
        {
            let { api, parameters, url, port, silent, insecure, host } = this;
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

            // nit.beep ({ url, headers, params }); // TODO: remove
            let res = await http.fetch (url.href,
            {
                method: api.requestMethod,
                headers: nit.assign (params.header, headers),
                body: params.form,
                rejectUnauthorized: !insecure
            });

            let { bold, inverse, green, red, gray } = nit.lookupClass ("nit.utils.Colorizer").Auto;
            let ok = ~~(res.statusCode / 100) == 2;
            let color = ok ? green : red;
            let tty = process.stdout.isTTY;

            if (!silent)
            {
                let statusOut = (tty || !ok) ? process.stderr : process.stdout;

                statusOut.write (bold (inverse (color (tty ? ` ${res.statusCode} ` : res.statusCode))) + " " + bold (nit.trim (res.statusMessage)) + "\n\n");

                nit.each (res.headers, function (v, k)
                {
                    statusOut.write (bold (k.split ("-").map (nit.pascalCase).join ("-") + ": " + v) + "\n");
                });

                statusOut.write ("\n");
            }

            if (!ok)
            {
                process.exitCode = 1;
            }

            if (!~~res.headers["content-length"])
            {
                res.destroy ();
                return;
            }

            if (res.isText)
            {
                let text = await res.text ();

                return gray (res.isJson ? nit.toJson (JSON.parse (text), "  ") : text);
            }
            else
            {
                return await res.binary ();
            }
        })
    ;
};
