module.exports = function (nit, http, Self)
{
    return (Self = http.defineConditional ("http.RequestFilter"))
        .use ("*zlib")
        .use (["rawBody", "*raw-body"])
        .categorize ("http.requestfilters")
        .registerPlugin ("http.Order")
        .defineInstanceDescriptor ()

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
        .lifecycleMethod ("apply", null, true) // onApply (ctx)
    ;
};
