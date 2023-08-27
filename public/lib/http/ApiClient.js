module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.ApiClient"))
        .use ("http.Xhr")
        .use ("http.ApiSpec")
        .use ("http.Cookies")
        .use ("http.PathParser")
        .m ("error.invalid_response_name", "The response name '%{name}' is invalid.")
        .constant ("UNEXPECTED_ERROR_CODE", "error.unexpected_error")
        .categorize ("http.apiclients")
        .defineMeta ("baseUrl")
        .defineNamespace ("apis")
        .defineNamespace ("responses")
        .defineNamespace ("models")
        .staticMemo ("shared", function () { return new this; })

        .staticMethod ("definePlaceholderConstraint", function (c)
        {
            var name = nit.ComponentDescriptor.toClassName (c.type, "constraints");

            nit.defineConstraint (name)
                .throws (c.code, c.message)
                .onValidate (function () { return true; })
            ;
        })
        .staticMethod ("addProperty", function (cls, method, cfg)
        {
            var clientClass = this;

            cls[method] (nit.omit (cfg.toPojo (), "constraints"));

            var field = cls.getLastField ();

            if (!field.primitive)
            {
                field.type = clientClass.name + ".models." + field.type;
            }

            nit.each (cfg.constraints, function (c)
            {
                c = c.toPojo ();

                try
                {
                    nit.Constraint.lookup (c.type);
                }
                catch (e)
                {
                    Self.definePlaceholderConstraint (c);
                }

                var options = c.options;
                var type = c.type;

                delete c.type;
                delete c.options;

                options = nit.assign (c, options);

                cls.constraint (type, options);
            });
        })

        .defineInnerClass ("Model", "nit.Class", "models", function (Model)
        {
            Model
                .staticMethod ("import", function (s)
                {
                    var cls = this;
                    var clientClass = cls.outerClass;

                    nit.each (s.fields, function (f)
                    {
                        clientClass.addProperty (cls, "field", f);
                    });

                    return cls;
                })
            ;
        })
        .defineInnerClass ("Response", Self.Model.name, "responses", function (Response)
        {
            Response
                .defineMeta ("status", "integer")
                .defineMeta ("message", "string")
                .defineMeta ("code", "string?")

                .staticMethod ("import", function (s)
                {
                    var cls = this;

                    cls.status = s.status;
                    cls.message = s.message;
                    cls.code = s.code;

                    return Self.Model.import.call (cls, s);
                })
            ;
        })
        .defineInnerClass ("UnexpectedErrorOccurred", Self.Response.name, function (UnexpectedErrorOccurred)
        {
            UnexpectedErrorOccurred
                .meta (
                {
                    status: 500,
                    message: "Sorry, we are unable to fulfill your request right now. Please try again later.",
                    code: Self.UNEXPECTED_ERROR_CODE
                })
                .field ("[error]", "Error")
            ;
        })
        .defineInnerClass ("Api", "nit.Class", "apis", function (Api)
        {
            Api
                .defineMeta ("method", "string")
                .defineMeta ("path", "string")
                .defineMeta ("description", "string")

                .staticMemo ("pathParser", function ()
                {
                    return new Self.PathParser (this.path);
                })
                .staticMethod ("send", function (args)
                {
                    var cls = this;
                    var clientClass = cls.outerClass;
                    var reqClass = cls.Request;
                    var request = nit.new (reqClass, nit.is (args, "arguments") ? args : arguments);

                    return nit.Queue ()
                        .push (function ()
                        {
                            return reqClass.validate (request);
                        })
                        .push (function ()
                        {
                            var params = {};

                            reqClass.parameters.forEach (function (p)
                            {
                                var s = p.source;
                                var d = params[s] = params[s] || {};

                                d[p.name] = request[p.name];
                            });

                            var url = clientClass.baseUrl + cls.pathParser.build (params.path);

                            if (params.query)
                            {
                                url = url.replace (/\?+$/, "");
                                url += (~url.indexOf ("?") ? "&" : "?") + nit.uriEncode (params.query);
                            }

                            nit.each (params.cookie, function (v, k) { Self.Cookies.set (k, v); });

                            return Self.Xhr.send (url, cls.method,
                            {
                                headers: params.header,
                                data: params.form
                            });
                        })
                        .push (function (ctx)
                        {
                            var response = ctx.result;
                            var respName = response.headers["X-Response-Name"];
                            var resCls = clientClass.responses[respName];

                            if (!resCls)
                            {
                                Self.throw ("error.invalid_response_name", { name: respName });
                            }

                            return new resCls (response.result);
                        })
                        .failure (function (ctx)
                        {
                            var error = ctx.error;
                            var code = error.code || Self.UNEXPECTED_ERROR_CODE;
                            var resCls = nit.find (clientClass.responses, function (r) { return r.code == code; }) || Self.UnexpectedErrorOccurred;
                            var violations = nit.get (error, "context.validationContext.violations", []);

                            return new resCls (
                            {
                                error: error,
                                violations: violations.map (function (v) { return v.toPojo (); })
                            });
                        })
                        .run ()
                    ;
                })
                .staticMethod ("import", function (s)
                {
                    var cls = this;
                    var clientClass = cls.outerClass;

                    nit.assign (cls, nit.pick (s, "method", "path", "description"));

                    cls.defineInnerClass ("Request", "http.Request", function (Request)
                    {
                        nit.each (s.request && s.request.parameters, function (p)
                        {
                            clientClass.addProperty (Request, "parameter", p);
                        });
                    });

                    return cls;
                })
            ;
        })
        .staticMethod ("importFromUrl", function (url)
        {
            var cls = this;

            cls.baseUrl = url;

            return nit.Queue ()
                .push (function ()
                {
                    return Self.Xhr.send (url);
                })
                .push (function (ctx)
                {
                    var spec = new Self.ApiSpec (nit.get (ctx, "result.result.spec"));

                    return cls.import (spec);
                })
                .run ()
            ;
        })
        .staticMethod ("import", function (spec)
        {
            var cls = this;

            nit.each (spec.apis, function (s)
            {
                cls.defineApi (s.name, function (Api)
                {
                    Api.import (s);

                    var sn = Api.simpleName;
                    var methodName = nit.lcFirst (sn);
                    var ctx = {};

                    ctx[sn] = Api;

                    cls.method (methodName, nit.createFunction (methodName, "return " + sn + ".send (arguments);", Api.Request.pargNames, ctx));
                });
            });

            nit.each (spec.models, function (s)
            {
                cls.defineModel (s.name, function (Model)
                {
                    Model.import (s);
                });
            });

            nit.each (spec.responses, function (s)
            {
                cls.defineResponse (s.name, function (Response)
                {
                    Response.import (s);
                });
            });

            return cls;
        })
    ;
};
