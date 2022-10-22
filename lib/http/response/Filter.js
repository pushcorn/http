module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.response.Filter"))
        .use ("*stream")
        .categorize ("http.response.filters")
        .registerPlugin ("http.Condition")
        .registerPlugin ("http.Order")

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
        .abstractMethod ("apply", /* istanbul ignore next */ function (ctx) // eslint-disable-line no-unused-vars
        {
        })
    ;
};
