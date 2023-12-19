module.exports = function (nit, http)
{
    return nit.defineClass ("http.Host")
        .categorize ("http.hosts")
        .defineCaster ("component")
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.RequestFilter", false, true)
        .registerPlugin ("http.ResponseFilter", false, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", "upgrade", "dispatch", { instancePluginAllowed: true, wrapped: false })

        .field ("hostnames...", "string", "The host names to which the the service should respond.")
        .field ("services...", "http.Service", "The services to run.", { backref: "host" })
        .field ("certificate", "http.Certificate", "The certificate to use.")
        .property ("server", "http.Server?")

        .getter ("hostname", function ()
        {
            return nit.coalesce (this.hostnames[0], "");
        })
        .onConstruct (function ()
        {
            let self = this;

            if (!nit.is.empty (self.hostnames))
            {
                self.constructor.condition.call (self, "http:hostname", ...self.hostnames);
            }
        })
        .configureComponentMethods (["init", "start"], true, (Queue, method) =>
        {
            Queue
                .after (`${method}.applyPlugins`, `${method}.callServices`, async function (self)
                {
                    for (let service of self.services)
                    {
                        await service[method] (...this.args);
                    }
                })
                .onComplete (self => self)
            ;
        })
        .configureComponentMethods ("stop", true, (Queue, method) =>
        {
            Queue
                .before (`${method}.invokeHook`, `${method}.callServices`, async function (self)
                {
                    for (let service of self.services)
                    {
                        await service[method] (...this.args);
                    }
                })
                .onComplete (self => self)
            ;
        })
        .configureComponentMethods ("upgrade", Queue =>
        {
            Queue
                .lpush ("preUpgrade", (self, req, socket, head) => self.preUpgrade (req, socket, head))
                .after ("upgrade.applyPlugins", "upgrade.callService", (self, req, socket, head) => http.selectApplicableObject (self.services, req)?.upgrade (req, socket, head))
                .onComplete ((self, req, socket, head) => nit.invoke.return ([self, "postUpgrade"], [req, socket, head], self))
            ;
        })
        .configureComponentMethods ("dispatch", Queue =>
        {
            Queue
                .until ((self, ctx) => !!ctx.response)
                .onInit ((self, ctx) => ctx.service = http.selectApplicableObject (self.services, ctx))
                .lpush ("preDispatch", (self, ctx) => self.preDispatch (ctx))
                .after ("dispatch.applyPlugins", "dispatch.callService", (self, ctx) => ctx.service?.dispatch (ctx))
                .onComplete ((self, ctx) => nit.invoke.return ([self, "postDispatch"], ctx, ctx))
            ;
        })
        .method ("lookupService", function (type)
        {
            let cls = nit.lookupComponent (type, "services");

            return this.services.find (s => s instanceof cls);
        })
    ;
};
