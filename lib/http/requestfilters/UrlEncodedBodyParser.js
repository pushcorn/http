module.exports = function (nit, http, Self)
{
    return (Self = http.defineRequestFilter ("UrlEncodedBodyParser"))
        .use ("*qs")
        .condition ("http:request-content-type", "*/*-urlencoded")
        .onApply (async function (ctx)
        {
            ctx.requestBody = Self.qs.parse (await Self.readBodyAsString (ctx));
        })
    ;
};
