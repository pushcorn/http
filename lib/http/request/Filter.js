module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.request.Filter"))
        .use ("*zlib")
        .use (["rawBody", "*raw-body"])
        .categorize ("http.request.filters")
        .registerPlugin ("http.Condition")
        .registerPlugin ("http.Order")

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

        .method ("readBodyAsBuffer", async function (ctx)
        {
            return await Self.parseStream (ctx.requestStream);
        })
        .method ("readBodyAsString", async function (ctx, encoding)
        {
            return await Self.parseStream (ctx.requestStream, { encoding: encoding || "utf8" });
        })
        .abstractMethod ("apply", /* istanbul ignore next */ function (ctx) // eslint-disable-line no-unused-vars
        {
        })
    ;
};
