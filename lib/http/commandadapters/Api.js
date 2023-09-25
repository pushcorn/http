module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.commandadapters.Api", "nit.CommandAdapter"))
        .use ("http")
        .use ("http.MimeType")
        .use ("nit.utils.Colorizer")
        .meta ({ category: "apis" })
        .constant ("METHODS_WITHOUT_REQUEST_BODY", ["GET", "DELETE", "HEAD"])
        .onBuildCommand ((Command, Api) =>
        {
            Command
                .describe (Api.description)
                .defineInput (Input =>
                {
                    Api.Request.parameters.forEach (p =>
                    {
                        Input.option (p.spec, p.type, p.description, nit.omit (p.toPojo (true), "get", "set"));
                    });

                    Input
                        .option ("xUrl", "string", "The API's base URL.", "http://127.0.0.1", { autoShortFlag: false })
                        .option ("xPort", "integer?", "The server port.", { autoShortFlag: false })
                        .option ("xSilent", "boolean", "Suppress the response status info.", { autoShortFlag: false })
                        .option ("xInsecure", "boolean", "Whether to reject connections with unverified certs.", { autoShortFlag: false })
                        .option ("xHost", "string", "The host name to use.", { autoShortFlag: false })
                    ;
                })
                .onRun (async function ({ input })
                {
                    let params = {};

                    Api.Request.parameters.forEach (p =>
                    {
                        let s = p.source || (Self.METHODS_WITHOUT_REQUEST_BODY.includes (Api.requestMethod) ? "query" : "form");
                        let d = params[s] = params[s] || {};
                        let v = input[p.name];

                        d[p.name] = p.primitive ? v : v?.toPojo?. ();
                    });

                    let reqPath = Api.lookupPlugin ("conditions", "http.conditions.RequestPath");
                    let { xUrl, xPort, xSilent, xHost, xInsecure } = input;
                    let url = new URL (xUrl);
                    let headers = { host: xHost };

                    url.port = xPort;
                    url.pathname = reqPath.parser.build (params.path);
                    url.search = nit.uriEncode (params.query);

                    let res = await Self.http.fetch (url.href,
                    {
                        method: Api.requestMethod,
                        headers: nit.assign (params.header, headers),
                        body: params.form,
                        rejectUnauthorized: !xInsecure
                    });

                    let { bold, inverse, green, red, gray } = Self.Colorizer.Auto;
                    let ok = ~~(res.statusCode / 100) == 2;
                    let color = ok ? green : red;
                    let tty = process.stdout.isTTY;

                    if (!xSilent)
                    {
                        let statusOut = (tty || !ok) ? process.stderr : process.stdout;

                        statusOut.write (bold (inverse (color (tty ? ` ${res.statusCode} ` : res.statusCode))) + " " + bold (res.statusMessage) + "\n");
                    }

                    if (!ok)
                    {
                        process.exitCode = 1;

                        if (!res.headers["content-length"])
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
                        return await nit.readStream (res, null);
                    }
                })
            ;
        })
    ;
};
