module.exports = function (nit, http, Self)
{
    return (Self = http.defineConditional ("http.Service"))
        .k ("init", "dispatch", "start", "stop", "upgrade")
        .mix ("logger")
        .categorize ("http.services")
        .field ("middlewares...", "http.Middleware", "The middlewares to run.")
        .property ("server", "http.Server")
        .property ("contextClass", "function", () =>
        {
            let Context = http.Server.Context;

            return Context.defineSubclass (Context.name + "$$" + nit.uuid ().slice (0, 8), true);
        })
        .defineInnerPlugin ("ServicePlugin", ServicePlugin =>
        {
            ServicePlugin
                .categorize ("http.serviceplugins")
                .lifecycleMethod ("preInit", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postInit", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("preStart", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postStart", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("preStop", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postStop", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("preUpgrade", null, /* istanbul ignore next */ function (service, req, socket, head) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postUpgrade", null, /* istanbul ignore next */ function (service, req, socket, head) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("preDispatch", null, /* istanbul ignore next */ function (service, ctx) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postDispatch", null, /* istanbul ignore next */ function (service, ctx) {}) // eslint-disable-line no-unused-vars
            ;
        })
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
                    await cls[Self.kDispatch].call (self, ctx);
                }

                await cls.applyPlugins ("serviceplugins", "postDispatch", self, ctx);

                return self;
            }
            ,
            async function (ctx)
            {
                await this.middlewares.find (m => m.applicableTo (ctx))?.run (ctx);
            }
        )
    ;
};
