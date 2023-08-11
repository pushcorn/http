module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("http.commands.Server"))
        .describe ("Run the web server.")
        .meta ("returnServer", "boolean", !nit.CLI_MODE)
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

                .option ("descriptor", "http.Server.Descriptor", "The server descriptor.",
                {
                    defval:
                    {
                        services:
                        [
                        {
                            name: "http:file-server",
                            options: true,
                            plugins:
                            [
                                "http:socket-io-server",
                                "http:live-reload"
                            ]
                        }
                        ,
                        "http:auto-restart"
                        ]
                    }
                })
            ;
        })
        .onRun (async function ({ input })
        {
            let { descriptor } = input;

            descriptor.options = descriptor.options || {};

            nit.assign.defined (descriptor.options, nit.omit (input.toPojo (), "descriptor"));

            this.server = await descriptor.build ().start ();

            return Self.returnServer ? this.server : "";
        })
    ;
};
