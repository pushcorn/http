module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Api"))
        .use ("http")
        .use ("http.MimeType")
        .use ("nit.utils.Colorizer")
        .constant ("METHODS_WITHOUT_REQUEST_BODY", ["GET", "DELETE", "HEAD"])
        .defineInput (Input =>
        {
            Input
                .option ("<api>", "http.ApiSubcommand", "The API to be invoked.")
                .option ("url", "string", "The API's base URL.", "http://127.0.0.1")
                .option ("port", "integer?", "The server port.")
                .option ("silent", "boolean", "Suppress the response status info.")
                .option ("insecure", "boolean", "Whether to reject connections with unverified certs.")
                .option ("host", "string", "The host name to use.")
            ;
        })
        .onRun (async function ({ input })
        {
            let params = {};
            let api = input.api;
            let Api = api.component;

            Api.Request.parameters.forEach (p =>
            {
                let s = p.source || (Self.METHODS_WITHOUT_REQUEST_BODY.includes (Api.requestMethod) ? "query" : "form");
                let d = params[s] = params[s] || {};
                let v = api.input[p.name];

                d[p.name] = p.primitive ? v : v?.toPojo?. ();
            });

            let reqPath = Api.lookupPlugin ("http.conditions.RequestPath");
            let { url, port, silent, host, insecure } = input;
            let headers = { host: host };

            url = new URL (url);
            url.port = port;
            url.pathname = reqPath.parser.build (params.path);
            url.search = nit.uriEncode (params.query);

            let res = await Self.http.fetch (url.href,
            {
                method: Api.requestMethod,
                headers: nit.assign (params.header, headers),
                body: params.form,
                rejectUnauthorized: !insecure
            });

            let { bold, inverse, green, red, gray } = Self.Colorizer.Auto;
            let ok = ~~(res.statusCode / 100) == 2;
            let color = ok ? green : red;
            let tty = process.stdout.isTTY;

            if (!silent)
            {
                let statusOut = (tty || !ok) ? process.stderr : process.stdout;

                statusOut.write (bold (inverse (color (tty ? ` ${res.statusCode} ` : res.statusCode))) + " " + bold (res.statusMessage) + "\n");
            }

            if (!ok)
            {
                process.exitCode = 1;

                if (~~res.headers["content-length"] == 0)
                {
                    return;
                }
            }

            let contentType = nit.trim (res.headers["content-type"]);
            let mime = contentType && Self.MimeType.lookup (contentType);

            if (!mime || mime.compressible !== false)
            {
                let text = await nit.readStream (res);

                if (contentType.match (/\/.*json$/) && text.length)
                {
                    text = nit.toJson (JSON.parse (text), "  ");
                }

                return gray (text);
            }
            else
            {
                return (await nit.readStream (res, null)).toString ("binary");
            }
        })
    ;
};
