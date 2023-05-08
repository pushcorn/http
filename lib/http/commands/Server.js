module.exports = function (nit)
{
    return nit.defineCommand ("http.commands.Server")
        .describe ("Run the web server.")
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
                .option ("autoReload", "boolean?", "Auto-reload the browser when an asset file is updated.")

                .option ("serverClass", "string", "The server class to use.", "http.Server")
                    .constraint ("subclass", "http.Server", true)
            ;
        })
        .run (async function ({ input })
        {
            let serverClass = nit.lookupClass (input.serverClass);
            let server = this.server = new serverClass (input.toPojo (true));

            await server.start ();
        })
    ;
};
