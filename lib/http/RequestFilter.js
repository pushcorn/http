module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("http.RequestFilter"))
        .meta ("unique", false)
        .use ("*zlib")
        .use (["rawBody", "*raw-body"])
        .use ("http.Order")
        .defineCaster ("component")
        .categorize ("http.requestfilters")
        .registerPlugin ("http.Condition", true, true)
        .registerPlugin ("http.Order")

        .onRegisteredBy (function (hostClass)
        {
            hostClass
                .method ("filterRequest", async function (ctx)
                {
                    let self = this;
                    let filters = self.constructor.getPlugins.call (self, "requestfilters");

                    for (let filter of Self.Order.applyOrders (filters))
                    {
                        if (filter.applicableTo (ctx))
                        {
                            await filter.apply (ctx);
                        }
                    }
                })
            ;
        })
        .staticMethod ("parseStream", async function (stream, encoding)
        {
            try
            {
                return await Self.rawBody (stream, nit.is.obj (encoding) ? encoding : { encoding });
            }
            catch (e)
            {
                throw e.status || e;
            }
        })
        .staticMethod ("readBodyAsBuffer", async function (ctx)
        {
            return await Self.parseStream (ctx.requestStream);
        })
        .staticMethod ("readBodyAsString", async function (ctx, encoding)
        {
            return await Self.parseStream (ctx.requestStream, { encoding: encoding || "utf8" });
        })
        .lifecycleMethod ("apply", true) // onApply (ctx)
    ;
};
