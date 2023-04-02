module.exports = function (nit, Self)
{
    const no_http = require ("http");
    const no_net = require ("net");
    const no_tls = require ("tls");


    return (Self = nit.defineClass ("http"))
        .constant ("RESPONSES_BY_STATUS", {})

        .defineInnerClass ("responses", responses =>
        {
            nit.each (nit.requireModule ("resources/http/status-codes.json"), function (message, status)
            {
                let name = message
                    .replace (/[A-Z]{2,}/g, m => nit.pascalCase (m.toLowerCase ()))
                    .replace (/[^\w]/g, "-")
                ;

                responses.defineInnerClass (nit.pascalCase (name), "http.Response", resCls =>
                {
                    Self.RESPONSES_BY_STATUS[status] = resCls;

                    resCls.info (status, message);
                });
            });
        })
        .staticMethod ("responseFor", function (status)
        {
            let resCls = Self.RESPONSES_BY_STATUS[status];

            return resCls && new resCls;
        })

        .registerInnerClass ("Negotiator", require ("negotiator"))
        .registerInnerClass ("IncomingMessage", nit.do (no_http.IncomingMessage, IncomingMessage =>
        {
            nit.dpgs (IncomingMessage.prototype,
            {
                hostname: function ()
                {
                    return this.headers[this.httpVersion.startsWith ("2.") ? ":authority" : "host"] || this.ip;
                }
                ,
                userAgent: function ()
                {
                    return nit.trim (this.headers["user-agent"]);
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
                ,
                contentType: function ()
                {
                    return nit.trim (this.headers["content-type"]).split (/\s*;\s*/)[0];
                }
            }, true);
        }))
        .registerInnerClass ("ServerResponse", no_http.ServerResponse)
        .registerInnerClass ("SecureContext", no_tls.SecureContext)
        .registerInnerClass ("Socket", nit.do (nit.mix (no_net.Socket, nit.Class), Socket =>
        {
            Socket
                .field ("requests...", "any", "The open requests.", { configurable: true })
            ;
        }))

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
        .require ("http.Condition")
        .require ("http.response.Filter")
        .require ("http.Response")
        .require ("http.Server")
    ;
};
