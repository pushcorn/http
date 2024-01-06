module.exports = function (nit, http)
{
    return nit.defineClass ("http.Host")
        .categorize ("http.hosts")
        .defineCaster ("component")
        .registerPlugin ("nit.ServiceProvider", true, true)
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.RequestFilter", false, true)
        .registerPlugin ("http.ResponseFilter", false, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", "upgrade", "dispatch", { instancePluginAllowed: true })
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
        .configureComponentMethods (["init", "start"], (Method, method) =>
        {
            Method
                .after (`${method}.applyPlugins`, `${method}.callServices`, async function (self)
                {
                    for (let service of self.services)
                    {
                        await service[method] (...this.args);
                    }
                })
                .afterComplete ("returnHost", self => self)
            ;
        })
        .configureComponentMethod ("stop", (Method, method) =>
        {
            Method
                .before (`${method}.invokeHook`, `${method}.callServices`, async function (self)
                {
                    for (let service of self.services)
                    {
                        await service[method] (...this.args);
                    }
                })
                .afterComplete ("returnHost", self => self)
            ;
        })
        .configureComponentMethod ("upgrade", Method =>
        {
            Method
                .after ("upgrade.applyPlugins", "upgrade.callService", (self, req, socket, head) => http.selectApplicableObject (self.services, req)?.upgrade (req, socket, head))
                .afterComplete ("returnHost", self => self)
            ;
        })
        .configureComponentMethod ("dispatch", Method =>
        {
            Method
                .before ("selectService", (self, ctx) => ctx.service = http.selectApplicableObject (self.services, ctx))
                .after ("dispatch.applyPlugins", "dispatch.callService", (self, ctx) => ctx.service?.dispatch (ctx))
                .afterComplete ("returnContext", (self, ctx) => ctx)
            ;
        })
        .method ("lookupService", function (type)
        {
            let cls = nit.lookupComponent (type, "services");

            return this.services.find (s => s instanceof cls);
        })
    ;
};
