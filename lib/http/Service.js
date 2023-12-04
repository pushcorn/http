module.exports = function (nit)
{
    return nit.defineClass ("http.Service")
        .categorize ("http.services")
        .defineCaster ("component")
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", "dispatch", { instancePluginAllowed: true, wrapped: false })
        .componentMethod ("upgrade", true)

        .field ("hostnames...", "string", "The host names to which the the service should respond.")
        .field ("handlers...", "http.Handler", "The handlers to run.", { backref: "service" })
        .field ("apis...", "http.Api", "The APIs to run.", { backref: "service" })
        .field ("actions...", "http.Action", "The actions to run.", { backref: "service" })
        .field ("requestFilters...", "http.RequestFilter", "The request filters.",
        [
            "http:json-body-parser",
            "http:multipart-body-parser",
            "http:url-encoded-body-parser",
            "http:text-body-parser"
        ])
        .field ("responseFilters...", "http.ResponseFilter", "The response filters.",
        [
            "http:body-compressor",
            "http:etag-builder",
            "http:cache-controller"
        ])
        .property ("host", "http.Host")
        .getter ("server", "host.server")
        .memo ("allHandlers", function ()
        {
            return this.handlers.concat (this.apis, this.actions);
        })
        .onConstruct (function ()
        {
            let self = this;

            if (self.hostnames.length)
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

            if (method.match (/stop$/i))
            {
                queue.before (`${method}.invokeHook`, `${method}.callHandlers`, async function ()
                {
                    for (let handler of self.allHandlers)
                    {
                        await handler[method] (...args);
                    }
                });
            }
            else
            {
                queue.after (`${method}.applyPlugins`, `${method}.callHandlers`, async function ()
                {
                    for (let handler of self.allHandlers)
                    {
                        await handler[method] (...args);
                    }
                });
            }

            queue.complete (() => self);
        })
        .onConfigureQueueForDispatch (function (queue, self, [ctx])
        {
            let cls = self.constructor;

            ctx.handler = self.allHandlers.find (h => h.applicableTo (ctx));
            ctx.requestFilters.push (...self.requestFilters);
            ctx.responseFilters.push (...self.responseFilters);

            queue
                .stopOn (() => !!ctx.response)
                .lpush ("preDispatch", self.preDispatch.bind (self, ctx))
                .before ("dispatch.invokeHook", "dispatch.readRequest", async function ()
                {
                    if (cls[cls.kDispatch])
                    {
                        await ctx.readRequest ();
                    }
                })
                .after ("dispatch.invokeHook", "dispatch.callHandler", () => ctx.handler?.run (ctx))
                .complete (() => nit.invoke.return ([self, "postDispatch"], ctx, ctx))
            ;
        })
        .onConfigureQueueForUpgrade (function (queue, self)
        {
            queue.complete (() => self);
        })
    ;
};
