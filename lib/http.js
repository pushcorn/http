module.exports = function (nit, Self)
{
    const no_http = require ("http");
    const no_https = require ("https");
    const no_net = require ("net");
    const no_tls = require ("tls");


    return (Self = nit.defineClass ("http"))
        .constant ("METHODS_WITHOUT_REQUEST_BODY", ["GET", "DELETE", "HEAD"])
        .constant ("RESPONSES_BY_STATUS", {})
        .constant ("REDIRECT_STATUS_CODE",
        {
            301: 1,
            302: 1,
            307: -1,
            308: -1
        })

        .staticMemo ("VERSION", () => require (nit.path.join (__dirname, "../package.json")).version)
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
        .defineInnerClass ("ClientRequestOptions", ClientRequestOptions =>
        {
            ClientRequestOptions
                .field ("[url]", "string|URL", "The request URL.")
                .field ("agent", "boolean|http.Agent", "Controls Agent behavior.")
                .field ("auth", "string?", "Basic authentication ('user:password') to compute an Authorization header.")
                .field ("createConnection", "function?",  "A function that produces a socket/stream to use for the request when the agent option is not used. This can be used to avoid creating a custom Agent class just to override the default createConnection function. See agent.createConnection() for more details. Any Duplex stream is a valid return value.")
                .field ("defaultPort", "integer?", "Default port for the protocol. Default: agent.defaultPort if an Agent is used, else undefined.")
                .field ("family", "integer?", "IP address family to use when resolving host or hostname. Valid values are 4 or 6. When unspecified, both IP v4 and v6 will be used.")
                .field ("headers", "object", "An object containing request headers.")
                .field ("hints", "integer?", "Optional dns.lookup() hints.")
                .field ("host", "string", "A domain name or IP address of the server to issue the request to.", "localhost")
                .field ("hostname", "string?", "Alias for host. To support url.parse(), hostname will be used if both host and hostname are specified.")
                .field ("insecureHTTPParser", "boolean",  "Use an insecure HTTP parser that accepts invalid HTTP headers when true. Using the insecure parser should be avoided.", false)
                .field ("localAddress", "string?", "Local interface to bind for network connections.")
                .field ("localPort", "integer?", "Local port to connect from.")
                .field ("lookup", "function?", "Custom lookup function.")
                .field ("maxHeaderSize", "integer", "Optionally overrides the value of --max-http-header-size (the maximum length of response headers in bytes) for responses received from the server.", 16384)
                .field ("method", "string", "A string specifying the HTTP request method.", "GET")
                .field ("path", "string", "Request path. Should include query string if any. E.G. '/index.html?page=12'.", "/")
                .field ("port", "integer?", "Port of remote server.")
                .field ("protocol", "string", "Protocol to use.", "http:")
                .field ("setHost", "boolean", "Specifies whether or not to automatically add the Host header.", true)
                .field ("signal", "AbortSignal", "An AbortSignal that may be used to abort an ongoing request.")
                .field ("socketPath", "string?", "Unix domain socket. Cannot be used if one of host or port is specified, as those specify a TCP Socket.")
                .field ("timeout", "integer?", "A number specifying the socket timeout in milliseconds. This will set the timeout before the socket is connected.")
                .field ("uniqueHeaders...", "string", "A list of request headers that should be sent only once. If the header's value is an array, the items will be joined using ; .")
                .field ("joinDuplicateHeaders", "boolean", "It joins the field line values of multiple headers in a request with , instead of discarding the duplicates.", false)
                .field ("rejectUnauthorized", "boolean", "Whether to reject connections with unverified certs.")

                // additional options
                .field ("maxRedirect", "integer", "The maximum number of redirections.", 20)
                .field ("body", "any", "The request body.")

                .onConstruct (function (url)
                {
                    url = nit.clone (url instanceof URL ? url : (nit.is.str (url) ? new URL (url) : undefined));

                    if (url)
                    {
                        url.port = nit.int (url.port, undefined);
                        url.path = nit.trim (url.pathname) + nit.trim (url.search);
                    }

                    let self = this;
                    let { body, headers } = self;
                    let headerNames = nit.keys (headers).map (h => h.toLowerCase ());

                    if (nit.is.obj (body))
                    {
                        self.body = body = JSON.stringify (body);

                        if (!headerNames.includes ("content-type"))
                        {
                            headers["Content-Type"] = "application/json";
                        }
                    }

                    if (!nit.is.undef (body) && !headerNames.includes ("content-length"))
                    {
                        headers["Content-Length"] = Buffer.byteLength (body);
                    }

                    nit.assign (self, url, nit.is.not.undef);
                })
            ;
        })
        .staticMethod ("responseFor", function (status)
        {
            let resCls = Self.RESPONSES_BY_STATUS[status] || Self.RESPONSES_BY_STATUS[500];

            return new resCls;
        })
        .staticMethod ("fetch", async function ()
        {
            let options = Self.ClientRequestOptions (...arguments).toPojo ();
            let maxRedirect = options.maxRedirect + 1;
            let method = options.method;
            let redirect;
            let res;

            do
            {
                let request = (options.protocol == "https:" ? no_https : no_http).request;
                let deferred = new nit.Deferred ();
                let req = request (options, res => deferred.resolve (res))
                    .on ("error", err => deferred.reject (err))
                ;

                if (options.body)
                {
                    req.write (options.body);
                }

                req.end ();

                res = await deferred;
                res.url = req.protocol + "//" + req.host + req.path;

                if ((redirect = Self.REDIRECT_STATUS_CODE[res.statusCode]))
                {
                    let opts = Self.ClientRequestOptions (res.headers.location).toPojo ();

                    nit.assign (options, opts, nit.is.not.empty);

                    opts.method = redirect < 0 ? method : opts.method;
                }
            }
            while (redirect && maxRedirect--);

            return res;
        })
        .staticMethod ("fetchText", async function ()
        {
            return await (await Self.fetch (...arguments)).text ();
        })
        .staticMethod ("fetchBuffer", async function ()
        {
            return await (await Self.fetch (...arguments)).buffer ();
        })
        .staticMethod ("fetchJson", async function ()
        {
            return await (await Self.fetch (...arguments)).json ();
        })
        .staticMethod ("fetchBinary", async function ()
        {
            return await (await Self.fetch (...arguments)).binary ();
        })

        .registerInnerClass ("Agent", no_http.Agent)
        .registerInnerClass ("Negotiator", require ("negotiator"))
        .registerInnerClass ("IncomingMessage", nit.do (no_http.IncomingMessage, IncomingMessage =>
        {
            const OLD_URL = nit.PPP + "oldUrl";

            nit.memoize.dpg (IncomingMessage.prototype, "parsedUrl",
                function ()
                {
                    nit.dpv (this, OLD_URL, this.url, true, false);

                    let parsed = nit.url.parse (this.url, true);

                    parsed.pathname = decodeURIComponent (nit.trim (parsed.pathname).replace (/\/$/, "") || "/");
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
                isText: function ()
                {
                    let mime = this.contentType && Self.MimeType.lookup (this.contentType);

                    return !mime || mime.compressible !== false;
                }
                ,
                isJson: function ()
                {
                    return this.isText && !!(this.pathname.endsWith (".json") || this.contentType.match (/\/.*json$/));
                }
                ,
                path: function ()
                {
                    return nit.trim (this.parsedUrl.path);
                }
                ,
                pathname: function ()
                {
                    return nit.trim (this.parsedUrl.pathname);
                }
                ,
                query: function ()
                {
                    return this.parsedUrl.query;
                }
                ,
                fullUrl: function ()
                {
                    return this.protocol + "://" + this.host + this.path;
                }
            }, true);

            nit.memoize.dms (IncomingMessage.prototype,
            {
                buffer: async function ()
                {
                    return await nit.readStream (this, null);
                }
                ,
                text: async function ()
                {
                    return (await this.buffer ()).toString ("utf8");
                }
                ,
                json: async function ()
                {
                    let text = await this.text ();

                    return text.length ? JSON.parse (text) : undefined;
                }
                ,
                binary: async function ()
                {
                    return (await this.buffer ()).toString ("binary");
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
        .staticMethod ("selectApplicableObject", function (objects, ctx)
        {
            if (!(ctx instanceof Self.Context))
            {
                ctx = Self.Context.new (nit.is.str (ctx) ? { headers: { host: ctx } } : ctx);
            }

            return objects.find (o => o.applicableTo (ctx));
        })
        .require ("http.Descriptor")
        .require ("http.TemplateTransform")
        .require ("http.MimeType")
        .require ("http.Handler")
        .require ("http.Api")
        .require ("http.Action")
        .require ("http.Service")
        .require ("http.Server")
        .require ("http.Task")
    ;
};
