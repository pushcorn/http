module.exports = function (nit)
{
    const no_http = require ("http");
    const no_tls = require ("tls");

    return nit.defineClass ("http")
        .registerInnerClass ("IncomingMessage", nit.do (no_http.IncomingMessage, IncomingMessage =>
        {
            nit.dpgs (IncomingMessage.prototype,
            {
                hostname: function ()
                {
                    return this.headers[this.httpVersion.startsWith ("2.") ? ":authority" : "host"] || this.ip;
                }
                ,
                ip: function ()
                {
                    return this.socket.remoteAddress;
                }
                ,
                realIp: function ()
                {
                    return this.headers["x-forwarded-for"] || this.ip;
                }
            }, true, false);
        }))
        .registerInnerClass ("ServerResponse", no_http.ServerResponse)
        .registerInnerClass ("SecureContext", no_tls.SecureContext)

        .staticTypeCheckedMethod ("createSecureContext", Method =>
        {
            Method
                .field ("<cert>", "nit.File", "The path of the SSL certificate.")
                .field ("<key>", "nit.File", "The path of the SSL private key.")
                .field ("[ca]", "nit.File", "The path of the CA cert.")
                .invoke (function (cert, key, ca)
                {
                    cert = cert.read ();
                    key = key.read ();
                    ca = ca && ca.read ();

                    return no_tls.createSecureContext ({ cert, key, ca });
                })
            ;
        })
        .require ("http.Response")
    ;
};
