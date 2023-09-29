module.exports = function (nit, http, Self)
{
    return (Self = http.defineConditional ("http.Service"))
        .plugin ("log-forwarder", "service.server")
        .registerPlugin ("http.ServicePlugin", true)
        .categorize ("http.services")

        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .field ("hostnames...", "string", "The hostnames of the requests that the service should handle.")
                .field ("conditions...", "http.Condition.Descriptor", "The conditions to check.")
                .field ("plugins...", "http.ServicePlugin.Descriptor", "The service plugins to use.")
                .field ("apis...", "http.Api.Descriptor", "The apis to handle requests.")
                .field ("actions...", "http.Action.Descriptor", "The actions to handle requests.")
                // assetResolvers and templateLoaders from plugins
                .field ("requestFilters...", "http.RequestFilter.Descriptor", "The request filters.",
                [
                    "http:json-body-parser",
                    "http:multipart-body-parser",
                    "http:url-encoded-body-parser",
                    "http:text-body-parser"
                ])
                .field ("responseFilters...", "http.ResponseFilter.Descriptor", "The response filters.",
                [
                    "http:body-compressor",
                    "http:etag-builder",
                    "http:cache-controller"
                ])

                .onConfigure (function (service)
                {
                    let self = this;
                    let serviceClass = service.constructor;

                    if (self.hostnames.length)
                    {
                        serviceClass.condition ("http:hostname", ...self.hostnames);
                    }

                    self.conditions.forEach (c => serviceClass.condition (c.build ()));
                    self.plugins.forEach (p => serviceClass.serviceplugin (p.build ()));

                    service.handlers.push (...self.apis.map (a => a.build ()));
                    service.handlers.push (...self.actions.map (a => a.build ()));
                    service.requestFilters.push (...self.requestFilters.map (f => f.build ()));
                    service.responseFilters.push (...self.responseFilters.map (f => f.build ()));
                })
            ;
        })

        .field ("handlers...", "http.Handler", "The handlers to run.")
        .field ("requestFilters...", "http.RequestFilter", "The request filters.")
        .field ("responseFilters...", "http.ResponseFilter", "The response filters.")
        .plugin ("http:asset-resolver")
        .plugin ("http:template-loader")
        .property ("server", "http.Server?")

        // --------------------------------
        .lifecycleMethod ("preInit", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls[Self.kPreInit]?.call (self);
            await cls.applyPlugins ("serviceplugins", "preInit", self);
        })
        .lifecycleMethod ("postInit", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("serviceplugins", "postInit", self);
            await cls[Self.kPostInit]?.call (self);
        })
        .lifecycleMethod ("init", async function (server)
        {
            let self = this;
            let cls = self.constructor;

            self.server = server;

            await self.preInit ();
            await cls[Self.kInit]?.call (self, server);
            await self.postInit ();

            for (let handler of self.handlers)
            {
                await handler.init (self);
            }

            return self;
        })

        // --------------------------------
        .lifecycleMethod ("preStart", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls[Self.kPreStart]?.call (self);
            await cls.applyPlugins ("serviceplugins", "preStart", self);
        })
        .lifecycleMethod ("postStart", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("serviceplugins", "postStart", self);
            await cls[Self.kPostStart]?.call (self);
        })
        .lifecycleMethod ("start", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await self.preStart ();
            await cls[Self.kStart]?.call (self);
            await self.postStart ();

            return self;
        })

        // --------------------------------
        .lifecycleMethod ("preStop", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls[Self.kPreStop]?.call (self);
            await cls.applyPlugins ("serviceplugins", "preStop", self);
        })
        .lifecycleMethod ("postStop", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("serviceplugins", "postStop", self);
            await cls[Self.kPostStop]?.call (self);
        })
        .lifecycleMethod ("stop", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await self.preStop ();
            await cls[Self.kStop]?.call (self);
            await self.postStop ();

            return self;
        })

        // --------------------------------
        .lifecycleMethod ("preUpgrade", async function (req, socket, head)
        {
            let self = this;
            let cls = self.constructor;

            await cls[Self.kPreUpgrade]?.call (self, req, socket, head);
            await cls.applyPlugins ("serviceplugins", "preUpgrade", self, req, socket, head);
        })
        .lifecycleMethod ("postUpgrade", async function (req, socket, head)
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("serviceplugins", "postUpgrade", self, req, socket, head);
            await cls[Self.kPostUpgrade]?.call (self, req, socket, head);
        })
        .lifecycleMethod ("upgrade", async function (req, socket, head)
        {
            let self = this;
            let cls = self.constructor;

            await self.preUpgrade (req, socket, head);
            await cls[Self.kUpgrade]?.call (self, req, socket, head);
            await self.postUpgrade (req, socket, head);

            return self;
        })

        // --------------------------------
        .lifecycleMethod ("preDispatch", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await cls[Self.kPreDispatch]?.call (self, ctx);
            await cls.applyPlugins ("serviceplugins", "preDispatch", self, ctx);
        })
        .lifecycleMethod ("postDispatch", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("serviceplugins", "postDispatch", self, ctx);
            await cls[Self.kPostDispatch]?.call (self, ctx);
        })
        .lifecycleMethod ("dispatch", async function (ctx)
        {
            let self = this;
            let cls = self.constructor;

            ctx.service = self;
            ctx.requestFilters.push (...self.requestFilters);
            ctx.responseFilters.push (...self.responseFilters);

            await self.preDispatch (ctx);

            if (!ctx.response)
            {
                if (cls[Self.kDispatch])
                {
                    await ctx.readRequest ();
                    await cls[Self.kDispatch].call (self, ctx);
                }
                else
                {
                    await self.handlers.find (h => h.applicableTo (ctx))?.dispatch (ctx);
                }
            }

            await self.postDispatch (ctx);

            return self;
        })
    ;
};
