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
                .option ("services...", "http.Service", "The services to run.")

                .option ("sslPort", "integer", "The SSL port.", 443)
                .option ("cert", "nit.File", "The path of the SSL certificate.")
                    .constraint ("dependent", "key")
                .option ("key", "nit.File", "The path of the SSL private key.")
                    .constraint ("dependent", "cert")
                .option ("ca", "nit.File", "The path of the CA cert.")

                .option ("keepAliveTimeout", "integer", "The Keep-Alive timeout in milliseconds.")
                    .constraint ("min", 0)

                .option ("oneShot", "boolean", "Handle one request then quit. This is used for debugging.")
                .option ("requestCert", "boolean", "Request the client certificate.")
                .option ("noHttp2", "boolean", "Use HTTP/2.")
                .option ("stopTimeout", "integer", "The time (ms) to wait before the server ends all connections when it's stopped.", 10 * 1000)

                .option ("serverClass", "string", "The server class to use.")
                    .constraint ("subclass", "http.Server")
            ;
        })
        .method ("run", async function (ctx)
        {
            let input = ctx.input.toPojo ();
            let server = this.server = nit.new (input.serverClass || "http.Server", input);

            await server.start ();
        })
    ;
};
