module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("http.commands.Server"))
        .describe ("Run the web server.")
        .use ("http.Server")
        .property ("server", "http.Server")
        .defineInput (Input =>
        {
            Input
                .option ("port", "integer?", "The non-SSL port.")
                .option ("address", "string?", "The listening host name or IP.")
                .option ("name", "string?", "The server name.")
                .option ("sslPort", "integer?", "The SSL port.")
                .option ("keepAliveTimeout", "integer?", "The Keep-Alive timeout in milliseconds.")
                    .constraint ("min", 0)

                .option ("oneShot", "boolean?", "Handle one request then quit. This is used for debugging.")
                .option ("requestCert", "boolean?", "Request the client certificate.")
                .option ("http2", "boolean?", "Use HTTP/2.")
                .option ("stopTimeout", "integer?", "The time (ms) to wait before the server ends all connections when it's stopped.")
                .option ("root", "string", "The root directory.")
                .option ("dev", "boolean", "Start the server in the dev mode.", true)
                .option ("config", "config", "The config key or object to use.",
                {
                    defval:
                    {
                        "serverplugins": "http:auto-restart",
                        "responsefilters":
                        [
                            "http:etag-builder",
                            "http:cache-controller",
                            "http:css-compiler",
                            "http:body-compressor",
                            {
                                "@name": "http:view-renderer",
                                "conditions":
                                {
                                    "@name": "http:response-content-type",
                                    "types": ["text/css", "text/html"]
                                }
                            }
                        ]
                        ,
                        "services":
                        [
                            "http:socket-io",
                            "http:live-reload",
                            {
                                "@name": "http:file-server",
                                "template": true,
                                "extensions": [".html", ".css"],
                                "indexes": "index.html"
                            }
                        ]
                    }
                })
            ;
        })
        .onRun (async function ({ input })
        {
            let { dev, root, config } = input;
            let options = nit.omit (input.toPojo (), "dev", "root", "config");

            nit.assign (options, config);

            let server = this.server = new Self.Server (options);

            if (root)
            {
                server.assetresolvers.push ({ roots: root });
            }

            await server.start ();
        })
    ;
};
