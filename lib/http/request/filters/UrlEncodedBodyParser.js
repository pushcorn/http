module.exports = function (nit, http, Self)
{
    return (Self = http.request.defineFilter ("UrlEncodedBodyParser"))
        .use ("*qs")
        .condition ("http:request-content-type", "*/*-urlencoded")
        .method ("apply", async function (ctx)
        {
            ctx.requestBody = Self.qs.parse (await this.readBodyAsString (ctx));
        })
    ;
};
