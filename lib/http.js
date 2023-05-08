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
            let resCls = Self.RESPONSES_BY_STATUS[status] || Self.RESPONSES_BY_STATUS[500];

            return new resCls;
        })

        .registerInnerClass ("Negotiator", require ("negotiator"))
        .registerInnerClass ("IncomingMessage", nit.do (no_http.IncomingMessage, IncomingMessage =>
        {
            const OLD_URL = "$__oldUrl";

            nit.memoize.dpg (IncomingMessage.prototype, "parsedUrl",
                function ()
                {
                    nit.dpv (this, OLD_URL, this.url, true, false);

                    let parsed = nit.url.parse (this.url, true);

                    parsed.pathname = parsed.pathname.replace (/\/$/, "") || "/";
                    parsed.query = nit.clone (parsed.query); // to avoid null prototype

                    return parsed;
                }
                ,
                function ()
                {
                    return this.url == this[OLD_URL];
                }
                ,
                true
            );

            nit.dpgs (IncomingMessage.prototype,
            {
                host: function ()
                {
                    return this.headers["x-forwarded-host"] || this.headers[this.httpVersion.startsWith ("2.") ? ":authority" : "host"] || this.ip || "";
                }
                ,
                hostname: function ()
                {
                    return nit.kvSplit (this.host, ":")[0];
                }
                ,
                userAgent: function ()
                {
                    return nit.trim (this.headers["user-agent"]);
                }
                ,
                protocol: function ()
                {
                    let proto;

                    if ((proto = this.headers["x-forwarded-proto"]))
                    {
                        return proto;
                    }

                    return this.socket.encrypted ? "https" : "http";
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
                ,
                path: function ()
                {
                    return this.parsedUrl.path;
                }
                ,
                pathname: function ()
                {
                    return this.parsedUrl.pathname;
                }
                ,
                query: function ()
                {
                    return this.parsedUrl.query;
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
        .require ("http.Conditional")
        .require ("http.Middleware")
        .require ("http.Server")
    ;
};
