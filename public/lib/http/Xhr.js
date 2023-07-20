module.exports = function (nit, global, Self)
{
    var writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("http.Xhr"))
        .m ("error.xhr_abort", "The request is aborted.")
        .m ("error.xhr_error", "The request failed due to an error.")
        .m ("error.xhr_timeout", "The request has timed out.")

        .constant ("METHODS", ["GET", "PUT", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS"])
        .constant ("METHODS_WITHOUT_REQUEST_BODY", ["GET", "DELETE", "HEAD"])

        .defineInnerClass ("Request", function (Request)
        {
            Request
                .field ("<url>", "string", "The request URL.")
                .field ("[method]", "string", "The request method.", "GET")
                    .constraint ("choice", { choices: Self.METHODS })
                .field ("data", "any", "The request data.")
                .field ("timeout", "integer", "The request timeout.")
                .field ("headers", "object", "The request headers.")
                .property ("xhr", Self.name, { writer: writer })
            ;
        })
        .defineInnerClass ("Response", function (Response)
        {
            Response
                .field ("status", "integer", "The status code.")
                .field ("statusText", "string", "The status message.")
                .field ("type", "string", "The response content type.")
                .field ("result", "any", "The response result.")
                .field ("headers", "object", "The response headers.")
                .property ("request", Self.Request.name, { writer: writer })
                .getter ("xhr", "request.xhr")

                .getter ("ok", function ()
                {
                    return this.status >= 200 && this.status < 300;
                })
                .staticMethod ("fromXhr", function (xhr)
                {
                    var headers = nit.trim (xhr.getAllResponseHeaders ());

                    headers = !headers ? {} : headers
                        .split (/[\r\n]+/)
                        .reduce (function (h, line)
                        {
                            var kv  = nit.kvSplit (line, ":");
                            var k   = kv[0].trim ().split ("-").map (nit.ucFirst).join ("-"); // eslint-disable-line newline-per-chained-call

                            h[k] = kv[1].trim ();

                            return h;
                        }, {})
                    ;

                    var type = headers["Content-Type"] || "";
                    var result;

                    if (~type.indexOf ("json") && xhr.responseText)
                    {
                        try
                        {
                            result = JSON.parse (xhr.responseText);
                        }
                        catch (e)
                        {
                            nit.debug (Self.name, e.stack);
                        }
                    }
                    else
                    {
                        result = xhr.response;
                    }

                    return new Response (
                    {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        headers: headers,
                        type: type,
                        result: result
                    });
                })
            ;
        })

        .field ("<request>", Self.Request.name, "The request object.")
        .property ("response", Self.Response.name)
        .property ("sent", "boolean", { writer: writer })
        .delegate ("result", "response.result")

        .memo ("deferred", function () { return new nit.Deferred; })
        .memo ("xhr", function ()
        {
            var xhr = new global.XMLHttpRequest;

            xhr.timeout = this.request.timeout;

            return xhr;
        })
        .staticMethod ("send", function (url, method) // eslint-disable-line no-unused-vars
        {
            return new Self (nit.new (Self.Request, arguments)).send ();
        })
        .do (function (cls)
        {
            Self.METHODS.forEach (function (method)
            {
                cls.staticMethod (method.toLowerCase (), function (url)
                {
                    return cls.send.apply (cls, [url, method].concat (nit.array (arguments).slice (1)));
                });
            });
        })

        .method ("send", function ()
        {
            var self = this;
            var req = self.request;
            var xhr = self.xhr;
            var data = req.data;
            var method = req.method;
            var url = req.url;
            var reqType;

            if (self.sent)
            {
                return self.deferred.promise;
            }

            req.xhr = writer.value (self);
            self.sent = writer.value (true);

            nit.each.obj (req.headers, function (v, k)
            {
                xhr.setRequestHeader (k, v);

                if (k.toLowerCase () == "content-type")
                {
                    reqType = v;
                }
            });

            if (!nit.is.empty (data))
            {
                if (~Self.METHODS_WITHOUT_REQUEST_BODY.indexOf (method))
                {
                    data = nit.uriEncode (data);
                    url = url.replace (/\?+$/, "");
                    url += (~url.indexOf ("?") ? "&" : "?") + data;
                    data = undefined;
                }
                else
                if (!reqType)
                {
                    xhr.setRequestHeader ("Content-Type", "application/json");

                    data = nit.toJson (data);
                }
            }

            function rejectWithError (code)
            {
                try
                {
                    self.throw (code);
                }
                catch (e)
                {
                    self.deferred.reject (e);
                }
            }

            xhr.onload = function ()
            {
                self.response = Self.Response.fromXhr (xhr);
                self.response.request = writer.value (req);

                self.deferred.resolve (self.response);
            };

            xhr.onerror = function () { rejectWithError ("error.xhr_error"); };
            xhr.onabort = function () { rejectWithError ("error.xhr_abort"); };
            xhr.ontimeout = function () { rejectWithError ("error.xhr_timeout"); };

            xhr.open (method, url);
            xhr.send (data);

            return self.deferred.promise;
        })
    ;
};
