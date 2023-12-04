module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.Handler"))
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
        .categorize ()
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", { instancePluginAllowed: true, wrapped: false })
        .componentMethod ("run", true)
        .componentMethod ("catch", true)
        .componentMethod ("finally", true)
        .plugin ("http:handler-adapter")
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
                .field ("error", "any", "The error thrown by the run method.")
            ;
        })

        .field ("[endpoint]", "string", "The endpoint that the handler should handle.")
        .field ("requestFilters...", "http.RequestFilter", "The request filters.")
        .field ("responseFilters...", "http.ResponseFilter", "The response filters.")
        .property ("service", "http.Service")
        .property ("requestMethod", "string")
        .property ("requestPath", "string")

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

            if (cls != Self && cls[cls.kRun] && !cls.requestMethod)
            {
                cls.endpoint ();
            }
        })
        .onConfigureQueueForRun (function (queue, handler, args)
        {
            let cls = handler.constructor;
            let ctx = args[0];

            ctx = ctx instanceof cls.Context ? ctx : cls.Context.new (ctx);
            ctx.handler = handler;
            ctx.requestFilters.push (...handler.requestFilters);
            ctx.responseFilters.push (...handler.responseFilters);

            args.splice (0, args.length, ctx);

            queue
                .stopOn (() => !!ctx.response)
                .after ("preRun", "preRun.readRequest", () => ctx.readRequest (cls.Request))
                .failure (function (c)
                {
                    ctx.error = c.error;
                    c.error = undefined;

                    return handler.catch (ctx);
                })
                .complete (function (c)
                {
                    ctx.error = c.error;

                    return nit.Queue ()
                        .push (handler.finally.bind (handler, ctx))
                        .complete (function (c)
                        {
                            ctx.error = nit.coalesce (c.error, ctx.error);

                            return ctx;
                        })
                        .run ()
                    ;
                })
            ;
        })
        .onCatch (function (ctx)
        {
            if (ctx.error)
            {
                throw ctx.error;
            }
        })
    ;
};
