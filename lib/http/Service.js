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

        .field ("path", "string", "The prefix of the request path that should be handled by the service.",
        {
            setter: function (v)
            {
                return nit.trim (v, "/");
            }
        })
        .field ("handlers...", "http.Handler", "The handlers to run.",
        {
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
            onLink: function (v)
            {
                if (!this.handlers.includes (v))
                {
                    this.handlers.push (v);
                }
            }
        })
        .property ("host", "http.Host")
        .getter ("server", "host.server")
        .onConstruct (function ()
        {
            let self = this;

            if (self.path)
            {
                self.constructor.condition.call (self, "http:request-path-prefix", self.path);
            }

            self.handlers.forEach (h => self.constructor.fieldMap.handlers.onLink.call (self, h));
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
                    for (let handler of self.handlers)
                    {
                        await handler[method] (...args);
                    }
                });
            }
            else
            {
                queue.after (`${method}.applyPlugins`, `${method}.callHandlers`, async function ()
                {
                    for (let handler of self.handlers)
                    {
                        await handler[method] (...args);
                    }
                });
            }

            queue.complete (() => self);
        })
        .onConfigureQueueForDispatch (function (queue, self, [ctx])
        {
            if (self.path)
            {
                ctx.enter ();
            }

            ctx.handler = self.handlers.find (h => h.applicableTo (ctx));

            queue
                .stopOn (() => !!ctx.response)
                .lpush ("preDispatch", self.preDispatch.bind (self, ctx))
                .before ("dispatch.invokeHook", "dispatch.readRequest", async function ()
                {
                    let cls = self.constructor;

                    if (cls[cls.kDispatch])
                    {
                        await ctx.readRequest ();
                    }
                })
                .after ("dispatch.applyPlugins", "dispatch.callHandler", () => ctx.handler?.run (ctx))
                .complete (() =>
                {
                    if (self.path)
                    {
                        ctx.leave ();
                    }

                    return nit.invoke.return ([self, "postDispatch"], ctx, ctx);
                })
            ;
        })
        .onConfigureQueueForUpgrade (function (queue, self)
        {
            queue.complete (() => self);
        })
    ;
};
