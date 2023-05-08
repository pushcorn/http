module.exports = function (nit, http, Self)
{
    let writer = new nit.Object.Property.Writer;

    return (Self = nit.defineClass ("http.Context"))
        .use ("http.MimeType")
        .use ("http.Order")
        .use ("http.responses.Noop")
        .use ("*vary")
        .use ("*stream")
        .use ("*zlib")
        .use (["rawBody", "*raw-body"])
        .registerPlugin ("http.RequestFilter")
        .registerPlugin ("http.ResponseFilter")
        .constant ("EMPTY_BODY_STATUSES", [204, 205, 304])
        .constant ("ENCODERS",
        {
            gzip: Self.zlib.createGzip,
            deflate: Self.zlib.createDeflate,
            br: Self.zlib.createBrotliCompress
        })
        .constant ("DECODERS",
        {
            gzip: Self.zlib.createGunzip,
            deflate: Self.zlib.createInflate,
            br: Self.zlib.createBrotliDecompress
        })
        .m ("error.response_not_set", "No response was set.")
        .m ("error.response_sent", "The response has already been sent.")

        .field ("<req>", "any", "The raw HTTP request.")
            .constraint ("type", "http.IncomingMessage", "http.mocks.IncomingMessage")
        .field ("<res>", "any", "The raw HTTP response.")
            .constraint ("type", "http.ServerResponse", "http.mocks.ServerResponse")

        .field ("request", "http.Request", "The typed client request.")
        .field ("response", "http.Response", "The typed server response.",
        {
            setter: function (resp)
            {
                if (resp)
                {
                    let self = this;
                    let empty = Self.EMPTY_BODY_STATUSES.includes (resp["@status"]);

                    self.res.statusCode  = resp["@status"];
                    self.res.statusMessage = resp["@message"];
                    self.responseBody = empty ? "" : resp.toBody (self);
                }

                return resp;
            }
        })

        .field ("responseEncoding", "string", "The response content encoding.")
        .field ("responseHeaders", "object", "The response headers.")
        .field ("pathParser", "http.PathParser", "The request path parser.")
        .field ("server", "http.Server", "The server instance.")
        .field ("service", "http.Service", "The service that is handling the request.")

        .property ("queryParams", "object")
        .property ("pathParams", "object")
        .property ("headerParams", "object")
        .property ("cookieParams", "object")
        .property ("formParams", "object")
        .property ("sent", "boolean", { writer })
        .property ("requestBody", "any")
        .property ("responseBody", "any",
        {
            setter: function (v)
            {
                this.responseHeader ("Content-Length", nit.is.str (v) || nit.is.buffer (v)
                    ? Buffer.byteLength (v)
                    : ""
                );

                return v;
            }
        })

        .getter ("method", "req.method")
        .getter ("path", "req.pathname")
        .getter ("url", "req.url")

        .getter ("requestEncoding", function ()
        {
            return this.req.headers["content-encoding"] || "identity";
        })
        .getter ("requestDecoder", function ()
        {
            return Self.DECODERS[this.requestEncoding];
        })
        .getter ("responseEncoder", function ()
        {
            return Self.ENCODERS[this.responseEncoding];
        })
        .getter ("responseContentLength", function ()
        {
            return this.responseHeader ("Content-Length");
        })
        .getter ("elapsed", function ()
        {
            return Date.now () - this.startTime;
        })
        .memo ("startTime", function ()
        {
            return Date.now ();
        })
        .memo ("requestStream", function ()
        {
            let req = this.req;
            let decoder = this.requestDecoder;

            return decoder ? req.pipe (decoder ()) : req;
        })
        .memo ("negotiator", function ()
        {
            return new http.Negotiator (this.req);
        })


        .staticMethod ("create", function (method, path, params)
        {
            ({ method = "GET", path = "/", params } = nit.typedArgsToObj (arguments,
            {
                method: "string",
                path: "string",
                params: "object"
            }));

            let req = nit.new ("http.mocks.IncomingMessage", method, path, params);
            let res = nit.new ("http.mocks.ServerResponse");

            return this (req, res);
        })
        .method ("readRequest", async function (requestClass)
        {
            let self = this;
            let req = self.req;

            if (self.pathParser)
            {
                self.pathParams = self.pathParser.parse (self.path);
            }

            self.queryParams = req.query;
            self.cookieParams = req.cookies;
            self.formParams = req.data; // from http.mocks.IncomingMessage

            nit.each (req.headers, function (v, k)
            {
                if (k != "cookie")
                {
                    self.headerParams[k.toLowerCase ()] = v;
                }
                else
                {
                    v.split (/\s*;\s*/).forEach (function (c)
                    {
                        let [k, v] = c.split ("=").map (decodeURIComponent);

                        self.cookieParams[k] = v;
                    });
                }
            });

            for (let filter of Self.Order.applyOrders (self.constructor.getPlugins ("requestfilters")))
            {
                if (filter.applicableTo (self))
                {
                    await filter.apply (self);
                }
            }

            if (nit.is.obj (self.requestBody))
            {
                nit.assign (self.formParams, self.requestBody);
            }

            if (requestClass)
            {
                self.request = requestClass.build (self);
            }
        })
        .method ("vary", function (...fields)
        {
            nit.each (fields, field =>
            {
                Self.vary (
                {
                    getHeader: (n) => this.responseHeader (n),
                    setHeader: (n, v) => this.responseHeader (n, v)

                }, field);
            });

            return this;
        })
        .method ("acceptsType", function (...types)
        {
            let args = nit.array (types, true).map (t => Self.MimeType.lookup (t)).filter (t => !!t);

            return this.negotiator.mediaType (args.map (t => t.name));
        })
        .method ("acceptsEncoding", function (...encodings)
        {
            return this.negotiator.encoding (nit.array (encodings, true));
        })
        .method ("acceptsCharset", function (...charsets)
        {
            return this.negotiator.charset (nit.array (charsets, true));
        })
        .method ("acceptsLanguage", function (...languages)
        {
            return this.negotiator.language (nit.array (languages, true));
        })
        .method ("responseHeader", function (name, value)
        {
            let lcName = name.toLowerCase ();

            if (arguments.length == 2)
            {
                for (let n in this.responseHeaders)
                {
                    if (n.toLowerCase () == lcName)
                    {
                        delete this.responseHeaders[n];
                    }
                }

                if (!nit.is.empty (value))
                {
                    this.responseHeaders[name] = value;
                }

                return this;
            }
            else
            {
                for (let n in this.responseHeaders)
                {
                    if (n.toLowerCase () == lcName)
                    {
                        return this.responseHeaders[n];
                    }
                }
            }
        })
        .method ("writeHeaders", function ()
        {
            let { res } = this;

            nit.each (this.responseHeaders, function (v, k)
            {
                res.setHeader (k, v);
            });

            return this;
        })
        .method ("send", function (resp)
        {
            if (this.sent)
            {
                this.throw ("error.response_sent");
            }

            let resCls;

            if (nit.is.str (resp))
            {
                resCls = nit.lookupComponent (resp, "responses", "http.Response");
                resp = nit.new (resCls, nit.array (arguments).slice (1));
            }

            if (resp)
            {
                this.response = resp;
            }

            if (!this.response)
            {
                this.throw ("error.response_not_set");
            }

            this.sent = writer.value (true);

            return this;
        })
        .method ("noop", function ()
        {
            this.send (new Self.Noop);
        })
        .method ("writeResponse", async function ()
        {
            let self = this;
            let { res, response } = self;

            if (res.writableEnded || response instanceof Self.Noop)
            {
                return this;
            }

            if (!response)
            {
                self.throw ("error.response_not_set");
            }

            for (let filter of Self.Order.applyOrders (self.constructor.getPlugins ("responsefilters")))
            {
                if (filter.applicableTo (self))
                {
                    await filter.apply (self);
                }
            }

            self.writeHeaders ();

            let body = self.responseBody;

            if (body instanceof Self.stream)
            {
                body.pipe (res);
            }
            else
            {
                res.end (body);
            }

            return this;
        })
    ;
};
