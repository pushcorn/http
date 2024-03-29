module.exports = function (nit, http, Self)
{
    let writer = new nit.Object.Property.Writer;

    return (Self = nit.defineClass ("http.Context", "nit.Context"))
        .use ("http.MimeType")
        .use ("http.Order")
        .use ("http.responses.Noop")
        .use ("*vary")
        .use ("*stream")
        .use ("*zlib")
        .use (["rawBody", "*raw-body"])
        .constant ("PATH_SEGMENT_PATTERN", /^[^/]+/)
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

        .field ("<req>", "http.IncomingMessage|http.mocks.IncomingMessage", "The raw HTTP request.")
        .field ("<res>", "http.ServerResponse|http.mocks.ServerResponse", "The raw HTTP response.")
        .field ("responseEncoding", "string", "The response content encoding.")
        .field ("responseHeaders", "object", "The response headers.")
        .field ("server", "http.Server?", "The server instance.")
        .field ("host", "http.Host?", "The host that is handling the request.")
        .field ("service", "http.Service?", "The service that is handling the request.")
        .field ("handler", "http.Handler?", "The handler that is handling the request.")
        .property ("request", "http.Request", { writer }) // The typed client request.
        .property ("response", "http.Response", // The typed server response.
        {
            setter: function (resp)
            {
                if (resp && resp != this.response)
                {
                    let self = this;
                    let respClass = resp.constructor;

                    self.res.statusCode = respClass.status;
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
        .property ("startTime", "Date", { writer })
        .property ("sent", "boolean", { writer })
        .property ("requestRead", "boolean", { writer })
        .property ("requestBody", "any")
        .property ("responseBody", "any")
        .delegate ("status", "res.statusCode")
        .getter ("method", "req.method")
        .getter ("path", function ()
        {
            return this.pathOverrides.slice (-1)[0] || this.req.pathname;
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

        .staticTypedMethod ("new",
            {
                method: "string", path: "string", params: "undef|object", options: "object"
            },
            function (method = "GET", path = "/", params, options)
            {
                let req = nit.new ("http.mocks.IncomingMessage", method, path, params);
                let res = nit.new ("http.mocks.ServerResponse");

                return nit.assign (new Self (req, res), options);
            }
        )
        .onConstruct (function ()
        {
            this.startTime = writer.value (new Date);
        })
        .onLookupServiceProvider (function (type)
        {
            let self = this;

            return (self.handler?.lookupServiceProvider (type))
                || (self.service?.lookupServiceProvider (type))
                || (self.host?.lookupServiceProvider (type))
                || (self.server?.lookupServiceProvider (type))
            ;
        })
        .method ("invoke", function (func, args, cb)
        {
            let self = this;

            return nit.invoke.then (func, args, function (error, result)
            {
                if (error)
                {
                    self.server.error (error);
                }

                return nit.coalesce (cb?.call (self, error, result), result);
            });
        })
        .method ("push", function (newPath)
        {
            newPath = newPath || nit.trim (this.path, "/").replace (Self.PATH_SEGMENT_PATTERN, "");

            this.pathOverrides.push (nit.trim (newPath) || "/");

            return this;
        })
        .method ("pop", function ()
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
                return;
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

            await self.handler?.filterRequest (self);
            await self.service?.filterRequest (self);
            await self.host?.filterRequest (self);
            await self.server?.filterRequest (self);

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

            let vc = new cls.ValidationContext ({ requestContext: ctx });

            return cls.validate (new cls (reqParams), vc);
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

            return (await self.handler?.resolveAsset (path))
                || (await self.service?.resolveAsset (path))
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

            return (await self.handler?.loadTemplate (path, self))
                || (await self.service?.loadTemplate (path, self))
                || (await self.host?.loadTemplate (path, self))
                || (await self.server?.loadTemplate (path, self))
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

            await self.buildResponseBody ();
            await self.handler?.filterResponse (self);
            await self.service?.filterResponse (self);
            await self.host?.filterResponse (self);
            await self.server?.filterResponse (self);

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
