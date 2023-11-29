module.exports = function (nit, http)
{
    return http.defineConditional ("http.Handler")
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
        .plugin ("lifecycle-component", "init", "start", "stop", "run", "catch", "finally", { wrapped: false })
        .do ("Plugin", Plugin =>
        {
            Plugin
                .mixin ("http:describable")
                .defineInstanceDescriptor ()
            ;
        })
        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .field ("endpoint", "string", "The endpoint that the handler should handle.")
                .field ("conditions...", "http.Condition.Descriptor", "The conditions to check.")
                .field ("plugins...", "http.HandlerPlugin.Descriptor", "The plugins to use.")
                .field ("requestFilters...", "http.RequestFilter.Descriptor", "The request filters.")
                .field ("responseFilters...", "http.ResponseFilter.Descriptor", "The response filters.")
                // assetResolvers and templateLoaders from plugins

                .onConfigure (function (handler)
                {
                    let self = this;
                    let handlerClass = handler.constructor;

                    if (self.endpoint)
                    {
                        handlerClass.endpoint (...nit.kvSplit (self.endpoint));
                    }

                    self.conditions.forEach (c => handlerClass.condition (c.build ()));
                    self.plugins.forEach (p => handlerClass.handlerplugin (p.build ()));

                    handler.requestFilters.push (...self.requestFilters.map (f => f.build ()));
                    handler.responseFilters.push (...self.responseFilters.map (f => f.build ()));
                })
            ;
        })
        .staticMethod ("defineDescriptor", function (builder)
        {
            return this.defineInnerClass ("Descriptor", this.superclass.Descriptor.name, builder);
        })
        .plugin ("http:asset-resolver")
        .plugin ("http:template-loader")

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

        .field ("requestFilters...", "http.RequestFilter", "The request filters.")
        .field ("responseFilters...", "http.ResponseFilter", "The response filters.")
        .property ("service", "http.Service?")

        .staticMethod ("endpoint", function (method, path)
        {
            let cls = this;
            let name = cls.simpleName;
            let prefix;

            if (!method)
            {
                for (let k in cls.verbMap)
                {
                    if (name.toLowerCase ().startsWith (k))
                    {
                        prefix = k;
                        method = cls.verbMap[k];
                        name = name.slice (k.length);

                        break;
                    }
                }

                method = method || "GET";
            }

            if (!path)
            {
                if (prefix && prefix != "get")
                {
                    name = nit.pluralize (name);
                }

                var ns = cls.name.split (".").slice (0, -2);

                path = "/" + ns.concat (name).map (nit.kababCase).join ("/");
            }

            return cls
                .meta ({ requestMethod: method, requestPath: path })
                .condition ("http:request-method", method)
                .condition ("http:request-path", path)
            ;
        })
        .staticMethod ("defineRequest", function (builder)
        {
            return this.defineInnerClass ("Request", this.superclass.Request.name, builder);
        })
        .staticMethod ("defineContext", function (builder)
        {
            return this.defineInnerClass ("Context", this.superclass.Context.name, builder);
        })
        .onDefineSubclass (Subclass =>
        {
            Subclass.defineRequest ();
            Subclass.defineContext ();
        })
        .onPostNsInvoke (function ()
        {
            let cls = this;

            if (cls[cls.kRun] && !cls.requestMethod)
            {
                cls.endpoint ();
            }
        })
        .onConfigureQueueForPreInit (function (queue, handler, args)
        {
            handler.service = args[0];
        })
        .onCatch (function (ctx)
        {
            if (ctx.error)
            {
                throw ctx.error;
            }
        })
        .lifecycleMethod ("run", async function (ctx)
        {
            var handler = this;
            let cls = handler.constructor;

            ctx = ctx instanceof cls.Context ? ctx : cls.Context.new (ctx);
            ctx.requestFilters.push (...handler.requestFilters);
            ctx.responseFilters.push (...handler.responseFilters);
            ctx.handler = handler;

            return handler.constructor.createInvocationQueue (handler, "run", [ctx], true)
                .stopOn (() => !!ctx.response)
                .before ("preRun", "readRequest", () => ctx.readRequest (cls.Request))
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
                .run ()
            ;
        })
    ;
};
