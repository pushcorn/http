module.exports = function (nit, Self)
{
    return (Self = nit.defineCommandPlugin ("http.commandplugins.Server"))
        .use ("http.Server")
        .constant ("STACK_LINE_PATTERN", /at([^(]+)(\(([^)]+):\d+:\d+\)).*/)
        .field ("name", "string?", "The server name.", "nit server")
        .field ("version", "string?", "The server version")
        .field ("config", "config?", "The config key or object to use.")
        .onUsedBy (function (hostClass)
        {
            let plugin = this;

            if (!plugin.version)
            {
                let packageRoot = nit.resolvePackageRoot (process.cwd ());

                if (!packageRoot)
                {
                    let match;

                    for (let line of nit.stack.split ("\n"))
                    {
                        if ((match = line.match (Self.STACK_LINE_PATTERN))
                            && nit.trim (match[1]) == "commandplugin")
                        {
                            packageRoot = nit.resolvePackageRoot (match[3]);
                            break;
                        }
                    }
                }

                if (packageRoot)
                {
                    nit.invoke.safe (() => plugin.version = require (nit.path.join (packageRoot, "package.json")).version);
                }
            }

            hostClass
                .defineInput (Input =>
                {
                    Input
                        .option ("port", "integer?", "The non-SSL port.")
                        .option ("address", "string?", "The listening host name or IP.")
                        .option ("name", "string?", "The server name.", plugin.name)
                        .option ("sslPort", "integer?", "The SSL port.")
                        .option ("stopTimeout", "integer?", "The time (ms) to wait before the server ends all connections when it's stopped.")
                        .option ("version", "string?", "The server version", plugin.version)
                        .option ("root", "string", "The root directory.")
                        .option ("keepAliveTimeout", "integer?", "The Keep-Alive timeout in milliseconds.")
                            .constraint ("min", 0)
                        .option ("oneShot", "boolean?", "Handle one request then quit. This is used for debugging.")
                        .option ("requestCert", "boolean?", "Request the client certificate.")
                        .option ("http2", "boolean?", "Use HTTP/2.")
                        .option ("config", "config", "The config key or object to use.", { defval: plugin.config })
                    ;
                })
                .property ("server", "http.Server")
                .onRun (async function ({ input })
                {
                    let { root, config } = input;
                    let options = nit.omit (input.toPojo (), "root", "config");

                    nit.assign (options, config);

                    let server = this.server = new Self.Server (options);

                    if (root)
                    {
                        server.assetresolvers.push ({ roots: root });
                    }

                    await server.start ();
                })
            ;
        })
    ;
};
