module.exports = function (nit, http)
{
    return http.request.defineFilter ("TextBodyParser")
        .condition ("http:request-content-type", "text/*")
        .method ("apply", async function (ctx)
        {
            ctx.requestBody = await this.readBodyAsString (ctx);
        })
    ;
};
