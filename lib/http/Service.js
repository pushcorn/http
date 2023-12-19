module.exports = function (nit, http)
{
    return nit.defineClass ("http.Service")
        .categorize ("http.services")
        .defineCaster ("component")
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.RequestFilter", false, true)
        .registerPlugin ("http.ResponseFilter", false, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", "dispatch", { instancePluginAllowed: true, wrapped: false })
        .componentMethod ("upgrade", true)

        .field ("mountPoint", "string", "The prefix of the request path that should be handled by the service.",
        {
            setter: function (v)
            {
                return nit.trim (v, "/");
            }
        })
        .field ("handlers...", "http.Handler", "The handlers to run.",
        {
            deferred: true,
            backref: "service",
            onLink: function (v)
            {
                if (v instanceof http.Api && !this.apis.includes (v))
                {
                    this.apis.push (v);
                }
                else
                if (v instanceof http.Action && !this.actions.includes (v))
                {
                    this.actions.push (v);
                }
            }
        })
        .field ("apis...", "http.Api", "The APIs to run.",
        {
            deferred: true,
            onLink: function (v)
            {
                if (!this.handlers.includes (v))
                {
                    this.handlers.push (v);
                }
            }
        })
        .field ("actions...", "http.Action", "The actions to run.",
        {
            deferred: true,
            onLink: function (v)
            {
                if (!this.handlers.includes (v))
                {
                    this.handlers.push (v);
                }
            }
        })
        .property ("host", "http.Host?")
        .getter ("server", "host.server")
        .onConstruct (function ()
        {
            let self = this;

            if (self.mountPoint)
            {
                self.constructor.condition.call (self, "http:request-path-prefix", self.mountPoint);
            }
        })
        .configureComponentMethods (["init", "start"], true, (Queue, method) =>
        {
            Queue
                .after (`${method}.applyPlugins`, `${method}.callHandlers`, async function (self)
                {
                    for (let handler of self.handlers)
                    {
                        await handler[method] (...this.args);
                    }
                })
                .onComplete (self => self)
            ;
        })
        .configureComponentMethods ("stop", true, (Queue, method) =>
        {
            Queue
                .before (`${method}.invokeHook`, `${method}.callHandlers`, async function (self)
                {
                    for (let handler of self.handlers)
                    {
                        await handler[method] (...this.args);
                    }
                })
                .onComplete (self => self)
            ;
        })
        .configureComponentMethods ("dispatch", Queue =>
        {
            Queue
                .until ((self, ctx) => !!ctx.response)
                .onInit ((self, ctx) =>
                {
                    if (self.mountPoint)
                    {
                        ctx.enter ();
                    }

                    ctx.handler = self.handlers.find (h => h.applicableTo (ctx));
                })
                .lpush ("preDispatch", (self, ctx) => self.preDispatch (ctx))
                .before ("dispatch.invokeHook", "dispatch.readRequest", async function (self, ctx)
                {
                    let cls = self.constructor;

                    if (cls[cls.kDispatch])
                    {
                        await ctx.readRequest ();
                    }
                })
                .after ("dispatch.applyPlugins", "dispatch.callHandler", (self, ctx) => ctx.handler?.run (ctx))
                .onComplete ((self, ctx) =>
                {
                    if (self.mountPoint)
                    {
                        ctx.leave ();
                    }

                    return nit.invoke.return ([self, "postDispatch"], ctx, ctx);
                })
            ;
        })
        .configureComponentMethods ("upgrade", Queue => Queue.onComplete (self => self))
    ;
};
