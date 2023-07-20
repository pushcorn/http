module.exports = function (nit, http, Self)
{
    return (Self = http.defineConditional ("http.Service"))
        .plugin ("logger")
        .registerPlugin ("http.ServicePlugin", true)
        .categorize ("http.services")

        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .field ("hostnames...", "string", "The hostnames of the requests that the service should handle.")
                .field ("contextClass", "http.Context.Descriptor", "The service context class.",
                {
                    defval:
                    {
                        requestfilters:
                        [
                            "http:json-body-parser",
                            "http:multipart-body-parser",
                            "http:url-encoded-body-parser",
                            "http:text-body-parser"
                        ]
                        ,
                        responsefilters:
                        [
                            "http:content-headers-builder",
                            "http:body-compressor",
                            "http:etag-builder",
                            "http:cache-controller"
                        ]
                    }
                })
                .field ("conditions...", "http.Condition.Descriptor", "The conditions to check.")
                .field ("plugins...", "http.ServicePlugin.Descriptor", "The service plugins to use.")
                .field ("apis...", "http.Api.Descriptor", "The apis to handle requests.")

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

                    service.contextClass = self.contextClass.build ();
                    service.apis.push (...self.apis.map (a => a.build ()));
                })
            ;
        })

        .field ("apis...", "http.Api", "The APIs to run.")
        .property ("server", "http.Server")
        .property ("contextClass", "function", () => Self.Descriptor ().contextClass.build ())

        .lifecycleMethod ("init", async function (server)
        {
            let self = this;
            let cls = self.constructor;

            self.server = server;

            await cls.applyPlugins ("serviceplugins", "preInit", self, server);
            await cls[Self.kInit]?.call (self, server);
            await cls.applyPlugins ("serviceplugins", "postInit", self, server);

            return self;
        })
        .lifecycleMethod ("start", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("serviceplugins", "preStart", self);
            await cls[Self.kStart]?.call (self);
            await cls.applyPlugins ("serviceplugins", "postStart", self);

            return self;
        })
        .lifecycleMethod ("stop", async function ()
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("serviceplugins", "preStop", self);
            await cls[Self.kStop]?.call (self);
            await cls.applyPlugins ("serviceplugins", "postStop", self);

            return self;
        })
        .lifecycleMethod ("upgrade", async function (req, socket, head)
        {
            let self = this;
            let cls = self.constructor;

            await cls.applyPlugins ("serviceplugins", "preUpgrade", self, req, socket, head);
            await cls[Self.kUpgrade]?.call (self, req, socket, head);
            await cls.applyPlugins ("serviceplugins", "postUpgrade", self, req, socket, head);

            return self;
        })
        .lifecycleMethod ("dispatch",
            async function (ctx)
            {
                let self = this;
                let cls = self.constructor;

                ctx.service = self;

                await cls.applyPlugins ("serviceplugins", "preDispatch", self, ctx);

                if (!ctx.response)
                {
                    if (cls[Self.kDispatch])
                    {
                        await ctx.readRequest ();
                        await cls[Self.kDispatch].call (self, ctx);
                    }
                    else
                    {
                        await self.apis.find (m => m.applicableTo (ctx))?.run (ctx);
                    }
                }

                await cls.applyPlugins ("serviceplugins", "postDispatch", self, ctx);

                return self;
            }
        )
    ;
};
