module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.Service"))
        .k ("callHandlers", "callHandler", "returnService", "pushPath", "readRequest", "popPath", "returnContext")
        .categorize ("http.services")
        .defineCaster ("component")
        .registerPlugin ("nit.ServiceProvider", true, true)
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.RequestFilter", false, true)
        .registerPlugin ("http.ResponseFilter", false, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", "upgrade", "dispatch", { instancePluginAllowed: true })
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
        .configureComponentMethods (["init", "start"], (Method, method) =>
        {
            Method
                .after (`${method}.applyPlugins`, Self.kCallHandlers, async function (self)
                {
                    for (let handler of self.handlers)
                    {
                        await handler[method] (...this.args);
                    }
                })
                .afterComplete (Self.kReturnService, self => self)
            ;
        })
        .configureComponentMethod ("stop", (Method, method) =>
        {
            Method
                .before (`${method}.invokeHook`, Self.kCallHandlers, async function (self)
                {
                    for (let handler of self.handlers)
                    {
                        await handler[method] (...this.args);
                    }
                })
                .afterComplete (Self.kReturnService, self => self)
            ;
        })
        .configureComponentMethod ("dispatch", Method =>
        {
            Method
                .before (Self.kPushPath, (self, ctx) =>
                {
                    if (self.mountPoint)
                    {
                        ctx.push ();
                    }

                    ctx.handler = http.selectApplicableObject (self.handlers, ctx);
                })
                .before ("dispatch.invokeHook", Self.kReadRequest, async function (self, ctx)
                {
                    let cls = self.constructor;

                    if (cls[cls.kDispatch])
                    {
                        await ctx.readRequest ();
                    }
                })
                .after ("dispatch.applyPlugins", Self.kCallHandler, (self, ctx) => ctx.handler?.dispatch (ctx))
                .beforeComplete (Self.kPopPath, (self, ctx) =>
                {
                    if (self.mountPoint)
                    {
                        ctx.pop ();
                    }
                })
                .afterComplete (Self.kReturnContext, (self, ctx) => ctx)
            ;
        })
        .configureComponentMethod ("upgrade", Method => Method.afterComplete (Self.kReturnService, self => self))
    ;
};
