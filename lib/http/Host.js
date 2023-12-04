module.exports = function (nit, http)
{
    return nit.defineClass ("http.Host")
        .defineCaster ("component")
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", "upgrade", "dispatch", { instancePluginAllowed: true, wrapped: false })

        .field ("hostnames...", "string", "The host names to which the the service should respond.")
        .field ("services...", "http.Service", "The services to run.", { backref: "host" })
        .field ("certificate", "http.Certificate", "The certificate to use.")
        .field ("requestFilters...", "http.RequestFilter", "The request filters.")
        .field ("responseFilters...", "http.ResponseFilter", "The response filters.")
        .property ("server", "http.Server")

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
        .onInitInvocationQueue (function (queue, self, method, args)
        {
            if (method.match (/dispatch$/i) || method.match (/upgrade$/i))
            {
                return;
            }

            let order = method.match (/stop$/i) ? "before" : "after";

            queue[order] (`${method}.invokeHook`, `${method}.callServices`, async function ()
            {
                for (let service of self.services)
                {
                    await service[method] (...args);
                }
            });

            queue.complete (() => self);
        })
        .onConfigureQueueForUpgrade (function (queue, self, [req, socket, head])
        {
            let service = http.selectApplicableObject (self.services, req.hostname);

            queue
                .lpush ("preUpgrade", self.preUpgrade.bind (self, req, socket, head))
                .after ("dispatch.invokeHook", "dispatch.callHost", () => service?.upgrade (req, socket, head))
                .complete (() => nit.invoke.return ([self, "postUpgrade"], [req, socket, head], self))
            ;
        })
        .onConfigureQueueForDispatch (function (queue, self, [ctx])
        {
            ctx.service = self.services.find (s => s.applicableTo (ctx));
            ctx.requestFilters.push (...self.requestFilters);
            ctx.responseFilters.push (...self.responseFilters);

            queue
                .stopOn (() => !!ctx.response)
                .lpush ("preDispatch", self.preDispatch.bind (self, ctx))
                .after ("dispatch.invokeHook", "dispatch.callService", () => ctx.service?.dispatch (ctx))
                .complete (() => nit.invoke.return ([self, "postDispatch"], ctx, ctx))
            ;
        })
    ;
};
