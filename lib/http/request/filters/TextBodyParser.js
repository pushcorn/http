module.exports = function (nit, http, Self)
{
    return (Self = http.request.defineFilter ("TextBodyParser"))
        .condition ("http:request-content-type", "text/*")
        .method ("apply", async function (ctx)
        {
            ctx.requestBody = await Self.readBodyAsString (ctx);
        })
    ;
};
