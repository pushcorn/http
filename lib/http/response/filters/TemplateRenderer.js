module.exports = function (nit, http, Self)
{
    return (Self = http.response.defineFilter ("TemplateRenderer"))
        .use ("http.Etag")
        .use ("nit.utils.Crypto")
        .use ("http.responses.FileReturned")
        .use (["TemplateEntry", "http.cache.entries.Template"])
        .orderAfter ("InfoBuilder")
        .orderBefore ("BodyCompressor")
        .condition ("http:custom", function (ctx, owner)
        {
            return owner.matcher.matches (ctx.responseHeader ("Content-Type"));
        })

        .field ("<contentType>", "string", "The template open tag.")
        .field ("[openTag]", "string", "The template open tag.", "{%")
        .field ("[closeTag]", "string", "The template close tag.", "%}")
        .field ("transforms", "object", "The template transforms.",
        {
            defval:
            {
                include: async function (file)
                {
                    return await this.cache.fetch (file, this);
                }
            }
        })
        .memo ("cache", function ()
        {
            return nit.new ("nit.Cache", "http.cache.entries.Template");
        })
        .memo ("matcher", function ()
        {
            return nit.new ("http.MimeTypeMatcher", this.contentType);
        })
        .method ("apply", async function (httpContext)
        {
            let { cache, openTag, closeTag, transforms } = this;
            let path;

            if (httpContext.response instanceof Self.FileReturned)
            {
                path = httpContext.response.path;
            }
            else
            {
                let body = await Self.readBodyAsString (httpContext);
                let hash = Self.Crypto.sha256 (body);

                path = nit.path.join (nit.os.tmpdir (), hash + ".html");

                let file = nit.new ("nit.File", path);

                if (!file.exists ())
                {
                    await file.writeAsync (body);
                }
            }

            let context = new Self.TemplateEntry.Context (
            {
                httpContext,
                cache,
                openTag,
                closeTag,
                transforms
            });

            httpContext.responseBody = await cache.fetch (path, context);
        })
    ;
};
