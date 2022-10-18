module.exports = function (nit, http, Self)
{
    let writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("http.Context"))
        .k ("initialized")
        .use ("http.MimeType")
        .use ("http.Order")
        .use ("http.responses.Noop")
        .use ("*url")
        .use ("*vary")
        .use ("*stream")
        .use ("*zlib")
        .use (["rawBody", "*raw-body"])
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
        .m ("error.response_not_allowed", "The response '%{type}' is not allowed.")
        .m ("error.field_not_initialized", "The field '%{field}' was not initialized.")

        .field ("<req>", "any", "The raw HTTP request.")
            .constraint ("type", "http.IncomingMessage", "http.mocks.IncomingMessage")
        .field ("<res>", "any", "The raw HTTP response.")
            .constraint ("type", "http.ServerResponse", "http.mocks.ServerResponse")

        .field ("request", "http.Request", "The parsed request.")
        .field ("response", "http.Response", "The handler response.",
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

        .field ("queryParams", "object", "The parsed query parameters.")
        .field ("pathParams", "object", "The parsed path parameters.")
        .field ("headerParams", "object", "The parsed header parameters.")
        .field ("cookieParams", "object", "The parsed cookie parameters.")
        .field ("formParams", "object", "The parsed form parameters.")

        .field ("responseEncoding", "string", "The response content encoding.")
        .field ("responseHeaders", "object", "The response headers.")
        .field ("route", "http.Route", "The matched route.",
        {
            setter: function (route)
            {
                if (route)
                {
                    this.pathParams = route.parse (this.path);
                }

                return route;
            }
        })
        .field ("handler", "http.Handler", "The handler that's processing the request.")
        .field ("server", "http.Server", "The server object.",
        {
            getter: function (v, prop)
            {
                return Self.assertFieldInitialized (this, prop, v);
            }
        })
        .field ("service", "http.Service", "The service that's processing the request.",
        {
            getter: function (v, prop)
            {
                return Self.assertFieldInitialized (this, prop, v);
            }
        })

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
        .getter ("path", "req.path")
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

        .registerPlugin ("http:request.Filter")
        .registerPlugin ("http:response.Filter")
        .construct (function (req, res) // eslint-disable-line no-unused-vars
        {
            let urlData = Self.url.parse (req.url, true);

            req.url = urlData.href;
            req.path = urlData.pathname.replace (/\/$/, "") || "/";

            this.queryParams = nit.clone (urlData.query); // to avoid null prototype
        })
        .postConstruct (function (obj)
        {
            nit.dpv (obj, Self.kInitialized, true, false, false);
        })

        .staticMethod ("create", function (method, path, params)
        {
            let req = nit.new ("http.mocks.IncomingMessage", method, path, params);
            let res = nit.new ("http.mocks.ServerResponse");

            return this (req, res);
        })
        .staticMethod ("assertFieldInitialized", function (owner, field, value)
        {
            let errKey = "$__" + field.name + "Error";

            if (!value && owner[Self.kInitialized] && !owner[errKey])
            {
                nit.dpv (owner, errKey, true, false, false);

                owner.throw ("error.field_not_initialized", { field: field.name });
            }

            return value;
        })
        .method ("parseRequest", async function ()
        {
            let self = this;
            let req = self.req;

            self.cookieParams = req.cookies;
            self.formParams = req.data;

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

            for (let filter of Self.Order.reorder (self.constructor.getPlugins ("requestFilters")))
            {
                if (filter.appliesTo (self))
                {
                    await filter.apply (self);
                }
            }

            if (nit.is.obj (self.requestBody))
            {
                nit.assign (self.formParams, self.requestBody);
            }

            return self;
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

            let { response, handler } = this;

            resCls = response.constructor;

            if (handler
                && handler.constructor.responses.length
                && !handler.constructor.responses.some (c => resCls == c))
            {
                this.throw ("error.response_not_allowed", { type: resCls.name });
            }

            this.sent = writer.value (true);

            return this;
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

            for (let filter of Self.Order.reorder (self.constructor.getPlugins ("responseFilters")))
            {
                if (filter.appliesTo (self))
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
