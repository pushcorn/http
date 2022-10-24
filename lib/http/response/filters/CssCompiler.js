module.exports = function (nit, http, Self)
{
    return (Self = http.response.defineFilter ("CssCompiler"))
        .use ("ui.css.Compiler")
        .orderAfter ("ContentHeadersBuilder")
        .orderBefore ("BodyCompressor")
        .condition ("http:response-content-type", "text/css")
        .condition ("http:custom", function ()
        {
            return Self.Compiler;
        })

        .method ("apply", async function (ctx)
        {
            let body = await Self.readBodyAsString (ctx);
            let compiler = new Self.Compiler;

            ctx.responseBody = await compiler.compile (body);
        })
    ;
};
