module.exports = function (nit, http, Self)
{
    return (Self = http.defineRequestFilter ("JsonBodyParser"))
        .condition ("http:request-content-type", "*/json", "application/*+json")
        .defineInnerClass ("InvalidJson", "http.Response", InvalidJson =>
        {
            InvalidJson.info (400, "The JSON content is invalid.");
        })
        .method ("apply", async function (ctx)
        {
            try
            {
                ctx.requestBody = JSON.parse (await Self.readBodyAsString (ctx));
            }
            catch (e)
            {
                throw nit.assign (new Self.InvalidJson, { cause: e });
            }
        })
    ;
};
