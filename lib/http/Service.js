module.exports = function (nit)
{
    return nit.defineClass ("http.Service")
        .categorize ("http.services")
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", "upgrade", { instancePluginAllowed: true, wrapped: false })

        .field ("hostnames...", "string", "The host names to which the the service should respond.")
        .field ("handlers...", "http.Handler", "The handlers to run.", { backref: "service" })
        .field ("apis...", "http.Api", "The APIs to run.", { backref: "service" })
        .field ("actions...", "http.Action", "The actions to run.", { backref: "service" })
        .field ("requestFilters...", "http.RequestFilter", "The request filters.", { caster: "component" },
        [
            "http:json-body-parser",
            "http:multipart-body-parser",
            "http:url-encoded-body-parser",
            "http:text-body-parser"
        ])
        .field ("responseFilters...", "http.ResponseFilter", "The response filters.", { caster: "component" },
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
            if (method.match (/dispatch$/i))
            {
                queue.after (`${method}.invokeHook`, `${method}.callHandler`, async function ()
                {
                    let [ctx] = args;
                    let handerMethod = nit.lcFirst (method.replace (/dispatch$/i, "Run"));

                    await ctx.handler?.[handerMethod] (ctx);
                });
            }
            else
            {
                let order = method.match (/stop$/i) ? "before" : "after";

                queue[order] (`${method}.invokeHook`, `${method}.callHandlers`, async function ()
                {
                    for (let handler of self.allHandlers)
                    {
                        await handler[method] (...args);
                    }
                });
            }

            queue.complete (() => self);
        })
        .componentMethod ("dispatch", false)
        .onConfigureQueueForDispatch (function (queue, self, [ctx])
        {
            let cls = self.constructor;

            ctx.service = self;
            ctx.requestFilters.push (...self.requestFilters);
            ctx.responseFilters.push (...self.responseFilters);
            ctx.handler = self.allHandlers.find (h => h.applicableTo (ctx));

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
                .complete (() => nit.invoke.return ([self, "postDispatch"], ctx, self))
            ;
        })
    ;
};
