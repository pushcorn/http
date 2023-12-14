module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.ApiClient"))
        .use ("http.Xhr")
        .use ("http.ApiSpec")
        .use ("http.Cookies")
        .use ("http.PathParser")
        .use ("http.Request")
        .m ("error.invalid_response_name", "The response name '%{name}' is invalid.")
        .constant ("UNEXPECTED_ERROR_CODE", "error.unexpected_error")
        .categorize ()
        .defineMeta ("url")
        .defineMeta ("spec", "http.ApiSpec")
        .defineNamespace ("apis")
        .defineNamespace ("responses")
        .defineNamespace ("models")

        .defineInnerClass ("Response", function (Response)
        {
            Response
                .defineMeta ("status", "integer")
                .defineMeta ("message", "string")
                .defineMeta ("code", "string?")
            ;
        })
        .defineInnerClass ("Api", function (Api)
        {
            Api
                .defineMeta ("requestMethod", "string")
                .defineMeta ("requestPath", "string")
                .defineMeta ("description", "string")
                .plugin ("lifecycle-component", "send")

                .defineInnerClass ("Request", "http.Request", function (Request)
                {
                    Request.method ("toParams", function ()
                    {
                        var self = this;
                        var cls = self.constructor;
                        var apiClass = cls.outerClass;
                        var params = {};

                        cls.parameters.forEach (function (p)
                        {
                            var s = p.source || (~http.METHODS_WITHOUT_REQUEST_BODY.indexOf (apiClass.requestMethod) ? "query" : "form");
                            var d = params[s] = params[s] || {};
                            var v = self[p.name];

                            d[p.name] = nit.toPojo (v);
                        });

                        return params;
                    });
                })
                .defineInnerClass ("Context", "nit.Context", function (Context)
                {
                    Context
                        .field ("request", Api.Request.name)
                        .field ("response", Self.Response.name)
                        .field ("api", Api.name)
                        .property ("res", Self.Xhr.Response.name)
                        .getter ("req", "res.request")
                        .getter ("xhr", "res.xhr")
                        .getter ("ok", "res.ok")
                    ;
                })
                .staticMethod ("defineRequest", function (builder)
                {
                    return this.defineInnerClass ("Request", this.superclass.Request.name, builder);
                })
                .staticMethod ("defineContext", function (builder)
                {
                    var cls = this;

                    return cls.defineInnerClass ("Context", cls.superclass.Context.name, function (Context)
                    {
                        Context
                            .field ("request", cls.Request.name)
                            .field ("api", cls.name)
                        ;

                        nit.invoke (builder, Context);
                    });
                })
                .staticMemo ("pathParser", function ()
                {
                    return new Self.PathParser (this.requestPath);
                })
                .onDefineSubclass (function (Subclass)
                {
                    Subclass.defineRequest ();
                    Subclass.defineContext ();
                })
                .configureComponentMethods ("send", function (Queue)
                {
                    Queue
                        .onInit (function (api)
                        {
                            var apiClass = api.constructor;
                            var requestClass = apiClass.Request;
                            var contextClass = apiClass.Context;
                            var args = this.args;
                            var ctx = args[0];

                            ctx = ctx instanceof contextClass ? ctx : nit.new (contextClass, { request: nit.new (requestClass, args) });
                            ctx.api = api;

                            this.args = ctx;
                        })
                        .before ("send.invokeHook", "send.validateRequest", function (api, ctx)
                        {
                            return api.constructor.Request.validate (ctx.request);
                        })
                        .after ("send.invokeHook", "send.sendRequest", function (api, ctx)
                        {
                            var params = ctx.request.toParams ();
                            var apiClass = api.constructor;
                            var clientClass = apiClass.outerClass;
                            var url = clientClass.url + apiClass.pathParser.build (params.path);

                            if (params.query)
                            {
                                url = url.replace (/\?+$/, "");
                                url += (~url.indexOf ("?") ? "&" : "?") + nit.uriEncode (params.query);
                            }

                            nit.each (params.cookie, function (v, k) { Self.Cookies.set (k, v); });

                            return Self.Xhr.send (url, apiClass.requestMethod,
                            {
                                headers: params.header,
                                data: params.form
                            });
                        })
                        .before ("postSend.invokeHook", "postSend.buildResponse", function (api, ctx)
                        {
                            var res = ctx.res = this.result;
                            var responseName = res.headers["X-Response-Name"];
                            var apiClass = api.constructor;
                            var clientClass = apiClass.outerClass;
                            var responseClass = nit.get (clientClass, responseName);

                            if (!responseClass)
                            {
                                clientClass.throw ("error.invalid_response_name", { name: responseName });
                            }

                            ctx.response = new responseClass (res.result);
                        })
                        .onFailure (function (api, ctx)
                        {
                            var error = this.error;
                            var apiClass = api.constructor;
                            var clientClass = apiClass.outerClass;
                            var code = error.code = error.code || "error.unexpected_error";
                            var responseClass = nit.find.result (clientClass.spec.responses, function (r) { if (r.code == code) { return nit.get (clientClass, r.name); } }) || Self.UnexpectedErrorOccurred;
                            var violations = nit.get (error, "context.validationContext.violations", []);

                            ctx.response = new responseClass (
                            {
                                error: error,
                                violations: nit.toPojo (violations)
                            });
                        })
                        .onComplete (function (api, ctx)
                        {
                            return ctx;
                        })
                    ;
                })
            ;
        })
        .staticMethod ("definePlaceholderConstraint", function (c)
        {
            var name = nit.ComponentDescriptor.toClassName (c.type, "constraints");

            nit.defineConstraint (name)
                .throws (c.code, c.message)
                .onValidate (function () { return true; })
            ;
        })
        .staticMethod ("defineModel", function (spec)
        {
            var cls = this;

            return cls.defineInnerClass (spec.name, function (Model)
            {
                nit.each (spec.fields, function (f)
                {
                    cls.addProperty (Model, f);
                });
            });
        })
        .staticMethod ("defineResponse", function (spec)
        {
            var cls = this;

            return cls.defineInnerClass (spec.name, cls.Response.name, function (Response)
            {
                Response.meta (spec);

                nit.each (spec.fields, function (f)
                {
                    cls.addProperty (Response, f);
                });
            });
        })
        .staticMethod ("defineApi", function (spec)
        {
            var cls = this;

            return cls
                .defineInnerClass (spec.name, cls.Api.name, function (Api)
                {
                    Api
                        .meta (spec)
                        .do ("Request", function (Request)
                        {
                            nit.each (spec.request && spec.request.parameters, function (p)
                            {
                                cls.addProperty (Request, p);
                            });
                        })
                    ;
                })
                .do (spec.name, function (Api) // add client.pkg.api () methods
                {
                    var ns = spec.name.split (".");
                    var sn = ns.pop ();
                    var pkg = ns.map (nit.ucFirst).join ("");
                    var apiName = nit.lcFirst (sn);
                    var pkgCls = cls[pkg];
                    var funcCtx = { send: function (args) { return nit.invoke ([new Api, "send"], args); } };

                    if (!pkgCls)
                    {
                        cls
                            .defineInnerClass (pkg, function (c) { pkgCls = c; })
                            .memo (ns[0], false, true, function () { return new pkgCls; }) // pkg
                        ;
                    }

                    nit.dpv (pkgCls.prototype,
                        apiName,
                        nit.createFunction (apiName, "return send (arguments);", Api.Request.pargNames, funcCtx),
                        true,
                        true
                    );
                })
            ;
        })

        .staticMethod ("addProperty", function (targetClass, prop)
        {
            var clientClass = this;
            var pp = targetClass.PRIMARY_PROPERTY_TYPE.split (".").pop ().toLowerCase ();

            targetClass[pp] (nit.omit (nit.toPojo (prop), "constraints"));

            var field = targetClass.getLastField ();

            if (!field.primitive && !global[field.type])
            {
                field.type = clientClass.name + "." + field.type;
            }

            nit.each (prop.constraints, function (c)
            {
                c = nit.toPojo (c);

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

                targetClass.constraint (type, options);
            });
        })
        .defineResponse (
        {
            name: "UnexpectedErrorOccurred",
            status: 500,
            message: "Sorry, we are unable to fulfill your request right now. Please try again later.",
            code: "error.unexpected_error",
            fields:
            [
            {
                spec: "[error]",
                type: "Error"
            }
            ]
        })
        .staticMethod ("buildFromUrl", function (url)
        {
            var cls = this;

            cls.url = url;

            return nit.invoke.return ([Self.Xhr, "send"], url, function (res)
            {
                return cls.build (nit.get (res, "result.spec"));
            });
        })
        .staticMethod ("build", function (spec)
        {
            var cls = this;

            cls.spec = spec;

            nit.each (spec.apis, function (s) { cls.defineApi (s); });
            nit.each (spec.models, function (s) { cls.defineModel (s); });
            nit.each (spec.responses, function (s) { cls.defineResponse (s); });

            return cls;
        })
    ;
};
