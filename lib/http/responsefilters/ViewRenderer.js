module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponseFilter ("ViewRenderer"))
        .use ("*stream")
        .orderBefore ("BodyCompressor")
        .field ("[openTag]", "string", "The template open tag.", "{{")
        .field ("[closeTag]", "string", "The template close tag.", "}}")
        .field ("[property]", "string", "The data property name.")
        .onApply (async function (ctx)
        {
            let self = this;
            let template;
            let body = ctx.responseBody;

            if (body instanceof Self.stream)
            {
                template = await nit.readStream (body);
            }
            else
            if (body instanceof Buffer)
            {
                template = body.toString ("utf8");
            }
            else
            {
                template = body + "";
            }

            ctx.render (template, nit.get (ctx, self.property), self.openTag, self.closeTag);
        })
    ;
};
