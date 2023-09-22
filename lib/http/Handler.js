module.exports = function (nit, http, Self)
{
    return (Self = http.defineConditional ("http.Handler"))
        .plugin ("logger")
        .defineMeta ("requestMethod", "string")
        .defineMeta ("requestPath", "string")
        .categorize ()
        .registerPlugin ("http.HandlerPlugin", true)
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

        .field ("requestFilters...", "http.RequestFilter", "The request filters.")
        .field ("responseFilters...", "http.ResponseFilter", "The response filters.")

        .staticMethod ("endpoint", function (method, path)
        {
            return this
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
        // --------------------------------
        .lifecycleMethod ("preInit", async function (service)
        {
            let self = this;
            let cls = self.constructor;

            await cls[Self.kPreInit]?.call (self, service);
            await cls.applyPlugins ("handlerplugins", "preInit", self, service);
        })
        .lifecycleMethod ("postInit", async function (service)
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("handlerplugins", "postInit", self, service);
            await cls[Self.kPostInit]?.call (self, service);
        })
        .lifecycleMethod ("init", async function (service)
        {
            let self = this;
            let cls = self.constructor;

            await self.preInit (service);
            await cls[Self.kInit]?.call (self, service);
            await self.postInit (service);
        })
        // --------------------------------
        .lifecycleMethod ("preRun", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await cls[Self.kPreRun]?.call (self, ctx);
            await cls.applyPlugins ("handlerplugins", "preRun", ctx, self);
        })
        .lifecycleMethod ("postRun", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("handlerplugins", "postRun", ctx, self);
            await cls[Self.kPostRun]?.call (self, ctx);
        })
        .lifecycleMethod ("run", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await self.preRun (ctx);
            await cls[Self.kRun]?.call (self, ctx);
            await self.postRun (ctx);
        })
        // --------------------------------
        .lifecycleMethod ("preCatch", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await cls[Self.kPreCatch]?.call (self, ctx);
            await cls.applyPlugins ("handlerplugins", "preCatch", ctx, self);
        })
        .lifecycleMethod ("postCatch", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("handlerplugins", "postCatch", ctx, self);
            await cls[Self.kPostCatch]?.call (self, ctx);
        })
        .lifecycleMethod ("catch", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await self.preCatch (ctx);
            await cls[Self.kCatch]?.call (self, ctx);
            await self.postCatch (ctx);

            if (ctx.error)
            {
                throw ctx.error;
            }
        })
        // --------------------------------
        .lifecycleMethod ("preFinalize", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await cls[Self.kPreFinalize]?.call (self, ctx);
            await cls.applyPlugins ("handlerplugins", "preFinalize", ctx, self);
        })
        .lifecycleMethod ("postFinalize", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("handlerplugins", "postFinalize", ctx, self);
            await cls[Self.kPostFinalize]?.call (self, ctx);
        })
        .lifecycleMethod ("finalize", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await self.preFinalize (ctx);
            await cls[Self.kFinalize]?.call (self, ctx);
            await self.postFinalize (ctx);
        })

        // --------------------------------
        .method ("dispatch", async function (root)
        {
            let self = this;
            let cls = self.constructor;
            let ctx = new cls.Context (root);

            root.handler = self;
            root.requestFilters.push (...self.requestFilters);
            root.responseFilters.push (...self.responseFilters);

            try
            {
                await root.readRequest (cls.Request);
                await self.run (ctx);
            }
            catch (e)
            {
                ctx.error = e;

                await self.catch (ctx);
            }
            finally
            {
                await self.finalize (ctx);
            }
        })

        // ----------------------------------------------
        // Delayed declaration so the lifecycle methods
        // can be called by Api and Action.
        // ----------------------------------------------
        .defineInnerClass ("Request", "http.Request")
        .defineInnerClass ("Context", Context =>
        {
            Context
                .field ("<root>", "http.Context", "The root context.")
                .field ("error", "Error", "The error thrown by the run method.")
                .getter ("req", "root.req")
                .getter ("res", "root.res")
                .getter ("method", "root.method")
                .getter ("path", "root.path")
                .getter ("url", "root.url")
                .getter ("resolve", "root.resolve")
                .getter ("noop", "root.noop")
                .getter ("render", "root.render")
                .getter ("send", "root.send")
                .getter ("sendFile", "root.sendFile")
                .getter ("sendJson", "root.sendJson")
                .getter ("sendText", "root.sendText")
                .getter ("sendData", "root.sendData")
                .delegate ("request", "root.request")
                .delegate ("response", "root.response")
            ;
        })
        .plugin ("http:asset-resolver")
        .plugin ("http:template-loader")
    ;
};
