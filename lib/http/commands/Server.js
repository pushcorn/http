module.exports = function (nit)
{
    return nit.defineCommand ("http.commands.Server")
        .describe ("Run the web server.")
        .property ("server", "http.Server")
        .defineInput (Input =>
        {
            Input
                .option ("port", "integer", "The non-SSL port.", 80)
                .option ("address", "string", "The listening host name or IP.", "0.0.0.0")
                .option ("name", "string", "The server name.", "nit")
                .option ("services...", "http.Service", "The services to run.", ["@http.services.File"])

                .option ("sslPort", "integer", "The SSL port.", 443)
                .option ("cert", "nit.File", "The path of the SSL certificate.")
                .option ("key", "nit.File", "The path of the SSL private key.")
                .option ("ca", "nit.File", "The path of the CA cert.")

                .option ("keepAliveTimeout", "integer", "The Keep-Alive timeout in milliseconds.")
                    .constraint ("min", 0)

                .option ("oneShot", "boolean", "Handle one request then quit. This is used for debugging.")
                .option ("requestCert", "boolean", "Request the client certificate.")
                .option ("noHttp2", "boolean", "Use HTTP/2.")
                .option ("stopTimeout", "integer", "The time (ms) to wait before the server ends all connections when it's stopped.", 10 * 1000)

                .option ("serverClass", "string", "The server class to use.", "http.Server")
                    .constraint ("subclass", "http.Server", true)

                .check ("dependency", "key", "cert")
                .check ("dependency", "cert", "key")
            ;
        })
        .run (async function ({ input })
        {
            let serverClass = nit.lookupClass (input.serverClass);
            let server = this.server = new serverClass (input.toPojo (),
            {
                services: input.services
            });

            await server.start ();
        })
    ;
};
