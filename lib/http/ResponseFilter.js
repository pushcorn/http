module.exports = function (nit, http, Self)
{
    return (Self = nit.definePlugin ("http.ResponseFilter"))
        .meta ("unique", false)
        .use ("*stream")
        .use ("http.Order")
        .defineCaster ("component")
        .categorize ("http.responsefilters")
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.Order")
        .onRegisteredBy (function (hostClass)
        {
            hostClass
                .method ("filterResponse", async function (ctx)
                {
                    let self = this;
                    let filters = self.constructor.getPlugins.call (self, "responsefilters", true, true);
                    let current = ctx.response;

                    for (let filter of Self.Order.applyOrders (filters))
                    {
                        if (filter.applicableTo (ctx))
                        {
                            await filter.apply (ctx);

                            if (current != ctx.response)
                            {
                                current = ctx.response;

                                await ctx.buildResponseBody ();
                            }
                        }
                    }
                })
            ;
        })
        .staticMethod ("readBodyAsString", async function (ctx)
        {
            let { responseBody: body } = ctx;

            if (body instanceof Self.stream)
            {
                body = await nit.readStream (body);
            }
            else
            if (nit.is.buffer (body))
            {
                body = body.toString ("utf8");
            }
            else
            {
                body += "";
            }

            return body;
        })
        .lifecycleMethod ("apply", true) // onApply (ctx)
    ;
};
