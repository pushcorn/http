module.exports = function (nit, http, Self)
{
    return (Self = http.defineRequestFilter ("TextBodyParser"))
        .condition ("http:request-content-type", "text/*")
        .onApply (async function (ctx)
        {
            ctx.requestBody = await Self.readBodyAsString (ctx);
        })
    ;
};
