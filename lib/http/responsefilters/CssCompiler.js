module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponseFilter ("CssCompiler"))
        .use ("ui.css.Compiler")
        .orderAfter ("ViewRenderer")
        .orderBefore ("BodyCompressor")
        .condition ("http:response-content-type", "text/css")
        .condition ("http:custom", function ()
        {
            return Self.Compiler;
        })

        .onApply (async function (ctx)
        {
            let body = await Self.readBodyAsString (ctx);
            let compiler = new Self.Compiler;

            ctx.sendText (await compiler.compile (body), "text/css");
        })
    ;
};
