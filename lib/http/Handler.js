module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.Handler"))
        .k ("initContext", "readRequest", "returnContext")
        .defineCaster ("component")
        .defineMeta ("requestMethod", "string")
        .defineMeta ("requestPath", "string")
        .defineMeta ("verbMap", "object", nit.o (
        {
            get: "GET",
            list: "GET",
            add: "POST",
            create: "POST",
            remove: "DELETE",
            delete: "DELETE",
            update: "PUT"
        }))
        .categorize ("http.handlers")
        .registerPlugin ("nit.ServiceProvider", true, true)
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.RequestFilter", false, true)
        .registerPlugin ("http.ResponseFilter", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", "dispatch", { instancePluginAllowed: true })
        .defineInnerClass ("Request", "http.Request")
        .defineInnerClass ("Context", "nit.Context", Context =>
        {
            Context
                .field ("<parent>", "nit.Context", "The parent context.",
                {
                    onLink: function ()
                    {
                        this.delegateParentProperties ();
                    }
                })
                .field ("error", "any", "The error thrown by the dispatch method.")
            ;
        })

        .field ("[endpoint]", "string", "The endpoint that the handler should handle.")
        .property ("service", "http.Service?")
        .property ("requestMethod", "string")
        .property ("requestPath", "string")
        .getter ("host", "service.host")
        .getter ("server", "host.server")

        .staticMethod ("endpoint", function (requestMethod, requestPath)
        {
            if (arguments.length == 1)
            {
                [requestMethod, requestPath] = nit.kvSplit (requestMethod);
            }

            let self = this;
            let instance = nit.is.obj (self) ? self : undefined;
            let cls = instance ? instance.constructor : self;
            let name = cls.simpleName;
            let prefix;

            if (!requestMethod)
            {
                for (let k in cls.verbMap)
                {
                    if (name.toLowerCase ().startsWith (k))
                    {
                        prefix = k;
                        requestMethod = cls.verbMap[k];
                        name = name.slice (k.length);

                        break;
                    }
                }

                requestMethod = requestMethod || "GET";
            }

            if (!requestPath)
            {
                if (prefix && prefix != "get")
                {
                    name = nit.pluralize (name);
                }

                var ns = cls.name.split (".").slice (0, -2);

                requestPath = "/" + ns.concat (name).map (nit.kababCase).join ("/");

                nit.each (cls.Request.parameters, p =>
                {
                    if (p.source == "path")
                    {
                        requestPath += "/:" + p.name;
                    }
                });
            }

            if (instance)
            {
                nit.assign (instance, { requestMethod, requestPath });
            }
            else
            {
                cls.meta ({ requestMethod, requestPath });
            }

            cls.condition.call (self, "http:request-method", requestMethod);
            cls.condition.call (self, "http:request-path", requestPath);

            return cls;
        })
        .staticMethod ("defineRequest", function (builder)
        {
            return this.defineInnerClass ("Request", this.superclass.Request.name, builder);
        })
        .staticMethod ("defineContext", function (builder)
        {
            return this.defineInnerClass ("Context", this.superclass.Context.name, builder);
        })
        .onConstruct (function (endpoint)
        {
            if (endpoint)
            {
                this.constructor.endpoint.call (this, endpoint);
            }
        })
        .onDefineSubclass (Subclass =>
        {
            Subclass.defineRequest ();
            Subclass.defineContext ();
        })
        .onPostNsInvoke (function ()
        {
            let cls = this;

            if (cls != Self && cls[cls.kDispatch] && !cls.requestMethod)
            {
                cls.endpoint ();
            }
        })
        .configureComponentMethod ("dispatch", Method =>
        {
            Method
                .before (Self.kInitContext, function (self)
                {
                    let cls = self.constructor;
                    let ctx = this.args[0];

                    ctx = ctx instanceof cls.Context ? ctx : cls.Context.new (ctx);
                    ctx.handler = self;

                    this.args = ctx;
                })
                .after ("preDispatch", Self.kReadRequest, (self, ctx) => ctx.readRequest (self.constructor.Request))
                .afterComplete (Self.kReturnContext, (self, ctx) => ctx)
            ;
        })
    ;
};
