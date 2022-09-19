module.exports = function (nit, Self)
{
    let writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("http.Context"))
        .k ("initialized")
        .use ("*url")
        .m ("error.response_not_set", "No response was set.")
        .m ("error.response_sent", "The response has already been sent.")
        .m ("error.response_not_allowed", "The response '%{type}' is not allowed.")
        .m ("error.field_not_initialized", "The field '%{field}' was not initialized.")

        .field ("<req>", "any", "The raw HTTP request.")
            .constraint ("type", "http.IncomingMessage", "http.mocks.IncomingMessage")
        .field ("<res>", "any", "The raw HTTP response.")
            .constraint ("type", "http.ServerResponse", "http.mocks.ServerResponse")

        .field ("request", "http.Request", "The parsed request.")
        .field ("response", "http.Response", "The handler response.")

        .field ("queryParams", "object", "The parsed query parameters.")
        .field ("pathParams", "object", "The parsed path parameters.")
        .field ("headerParams", "object", "The parsed header parameters.")
        .field ("cookieParams", "object", "The parsed cookie parameters.")
        .field ("formParams", "object", "The parsed form parameters.")

        .field ("responseHeaders", "object", "The response headers.")
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
        .field ("route", "http.Route", "The matched route.",
        {
            getter: function (v, prop)
            {
                return Self.assertFieldInitialized (this, prop, v);
            }
        })
        .field ("handler", "http.Handler", "The handler that's processing the request.",
        {
            getter: function (v, prop)
            {
                return Self.assertFieldInitialized (this, prop, v);
            }
        })

        .property ("sent", "boolean", { writer })

        .getter ("method", function ()
        {
            return nit.get (this, "req.method");
        })
        .getter ("path", function ()
        {
            return nit.get (this, "req.path");
        })
        .getter ("url", function ()
        {
            return nit.get (this, "req.url");
        })
        .construct (function (req, res) // eslint-disable-line no-unused-vars
        {
            let urlData = Self.url.parse (req.url, true);

            req.url = urlData.href;
            req.path = urlData.pathname;

            this.queryParams = nit.clone (urlData.query); // to avoid null prototype
        })
        .postConstruct (function (obj)
        {
            nit.dpv (obj, Self.kInitialized, true, false, false);
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

            // route must be set
            self.pathParams = self.route.parse (req.path);
            self.cookieParams = req.cookies;

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

            return this;
        })
        .method ("responseHeader", function (name, value)
        {
            if (arguments.length == 2)
            {
                this.responseHeaders[name] = value;
            }
            else
            {
                return this.responseHeaders[name];
            }
        })
        .method ("writeHeaders", function ()
        {
            let { res } = this;

            nit.each (this.responseHeaders, function (v, k)
            {
                res.setHeader (k, v);
            });
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
        })
    ;
};
