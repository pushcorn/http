module.exports = function (nit, http, Self)
{
    return (Self = http.defineConditional ("http.ResponseFilter"))
        .use ("*stream")
        .categorize ("http.responsefilters")
        .registerPlugin ("http.Order")
        .defineInstanceDescriptor ()

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
        .lifecycleMethod ("apply", null, true) // onApply (ctx)
    ;
};
