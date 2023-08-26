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

        .field ("responseEncoding", "string", "The response content encoding.")
        .field ("responseHeaders", "object", "The response headers.")
        .field ("server", "http.Server", "The server instance.")
        .field ("host", "http.Host", "The host that is handling the request.")
        .field ("service", "http.Service", "The service that is handling the request.")
        .field ("requestFilters...", "http.RequestFilter", "The request filters.")
        .field ("responseFilters...", "http.ResponseFilter", "The response filters.")

        .property ("request", "http.Request", { writer }) // The typed client request.
        .property ("response", "http.Response", // The typed server response.
        {
            setter: function (resp)
            {
                if (resp != this.response)
                {
                    let self = this;
                    let respClass = resp.constructor;

                    self.res.statusCode  = respClass.status;
                    self.res.statusMessage = respClass.message;
                }

                return resp;
            }
        })
        .property ("pathOverrides...", "string")
        .property ("pathParams", "object")
        .property ("queryParams", "object")
        .property ("headerParams", "object")
        .property ("cookieParams", "object")
        .property ("formParams", "object")
        .property ("file", "string") // The file that the response represent.
        .property ("sent", "boolean", { writer })
        .property ("requestRead", "boolean", { writer })
        .property ("requestBody", "any")
        .property ("responseBody", "any")
        .delegate ("status", "res.statusCode")
        .getter ("method", "req.method")
        .getter ("path", function ()
        {
            let os = this.pathOverrides;

            return os[os.length - 1] || this.req.pathname;
        })
        .getter ("url", "req.url")
        .getter ("fullUrl", "req.fullUrl")

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
        .getter ("params", function ()
        {
            let ctx = this;

            return nit.assign ({}, ctx.queryParams, ctx.formParams, ctx.pathParams, ctx.cookieParams, ctx.headerParams);
        })
        .memo ("startTime", function ()
        {
            return new Date;
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

        .staticMethod ("new", function (method, path, params, options)
        {
            ({ method = "GET", path = "/", params, options } = nit.typedArgsToObj (arguments,
            {
                method: "string",
                path: "string",
                params: "object",
                options: "object"
            }));

            let req = nit.new ("http.mocks.IncomingMessage", method, path, params);
            let res = nit.new ("http.mocks.ServerResponse");

            return nit.assign (new Self (req, res), options);
        })
        .method ("enter", function (newPath)
        {
            this.pathOverrides.push (nit.trim (newPath) || "/");

            return this;
        })
        .method ("leave", function ()
        {
            this.pathOverrides.pop ();

            return this;
        })
        .method ("readRequest", async function (requestClass)
        {
            let self = this;
            let req = self.req;

            if (self.requestRead)
            {
                return self.request;
            }

            self.requestRead = writer.value (true);
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

            for (let filter of Self.Order.applyOrders (self.requestFilters))
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
                self.request = writer.value (await self.buildRequest (requestClass));
            }
        })
        .method ("buildRequest", async function (cls)
        {
            let ctx = this;
            let params = ctx.params;
            let reqParams = {};

            cls.parameters.forEach (p =>
            {
                if (p.source)
                {
                    reqParams[p.name] = nit.get (ctx, p.source + "Params." + p.sourceName);
                }
                else
                {
                    reqParams[p.name] = params[p.name];
                }
            });

            return cls.validate (new cls (reqParams));
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
            let names = nit.array (types, true)
                .map (t => Self.MimeType.lookup (t))
                .filter (t => !!t)
                .map (t => t.name)
            ;

            return this.negotiator.mediaType (names);
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

            return this;
        })
        .method ("sendFile", async function (path, contentType)
        {
            this.send ("http:file", { path, contentType });
        })
        .method ("sendJson", function (json, contentType)
        {
            this.send ("http:json", { json, contentType });
        })
        .method ("sendData", function (data, contentType)
        {
            this.send ("http:data", { data, contentType });
        })
        .method ("sendText", function (text, contentType)
        {
            this.send ("http:text", { text, contentType });
        })
        .method ("render", function (template, data, openTag, closeTag)
        {
            this.send ("http:view", { template, data, openTag, closeTag });
        })
        .method ("noop", function ()
        {
            this.send (new Self.Noop);
        })
        .method ("redirect", function (status, location, urlChanges)
        {
            ({ status = 302, location = "/", urlChanges } = nit.typedArgsToObj (arguments,
            {
                status: "integer",
                location: "string",
                urlChanges: "dto"
            }));

            if (urlChanges)
            {
                location = nit.url.format (nit.assign (nit.url.parse (this.fullUrl), urlChanges));
            }

            this.responseHeader ("Location", location);
            this.send (new http.responseFor (status));
        })
        .method ("resolveAsset", async function (path)
        {
            let self = this;

            if (path.startsWith ("file://")
                && (path = path.slice (7))
                && (await nit.isFileAsync (path)))
            {
                return path;
            }

            return (await self.service?.resolveAsset (path))
                || (await self.host?.resolveAsset (path))
                || (await self.server?.resolveAsset (path))
            ;
        })
        .method ("loadTemplate", async function (path)
        {
            let self = this;

            if (!(path = await self.resolveAsset (path)))
            {
                return;
            }

            return (await self.service?.loadTemplate (path, self))
                || (await self.host?.loadTemplate (path, self))
                || (await self.server?.loadTemplate (path, self))
                || (await nit.readFileAsync (path))
            ;
        })
        .method ("writeResponse", async function ()
        {
            let self = this;
            let { res, response } = self;

            if (res.writableEnded || response instanceof Self.Noop)
            {
                return self;
            }

            if (!response)
            {
                self.throw ("error.response_not_set");
            }

            let current = response;

            await self.buildResponseBody ();

            for (let filter of Self.Order.applyOrders (self.responseFilters))
            {
                if (filter.applicableTo (self))
                {
                    await filter.apply (self);

                    if (current != self.response)
                    {
                        current = self.response;

                        await self.buildResponseBody ();
                    }
                }
            }

            self.sent = writer.value (true);
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
        .method ("buildResponseBody", async function ()
        {
            let self = this;
            let response = self.response;
            let empty = Self.EMPTY_BODY_STATUSES.includes (response.constructor.status);
            let body = self.responseBody = empty ? "" : await response.toBody (self);

            if (!self.responseHeader ("Content-Type"))
            {
                let ext = nit.path.extname (self.file || self.path);

                self.responseHeader ("Content-Type", Self.MimeType.lookupName (ext));
            }

            if (self.file)
            {
                let stats = await nit.fs.promises.stat (self.file);

                self
                    .responseHeader ("Content-Length", stats.size)
                    .responseHeader ("Last-Modified", stats.mtime.toUTCString ())
                ;
            }
            else
            {
                self.responseHeader ("Content-Length", nit.is.str (body) || nit.is.buffer (body)
                    ? Buffer.byteLength (body)
                    : ""
                );
            }
        })
    ;
};
