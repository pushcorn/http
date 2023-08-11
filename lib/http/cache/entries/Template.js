module.exports = function (nit)
{
    return nit.defineClass ("http.cache.entries.Template", "nit.cache.entries.File")
        .defineInnerClass ("Context", Context =>
        {
            Context
                .field ("<httpContext>", "http.Context", "The HTTP context.")
                .field ("<cache>", "nit.Cache", "The cache object.")
                .field ("[openTag]", "string", "The template open tag.", "{%")
                .field ("[closeTag]", "string", "The template close tag.", "%}")
                .field ("transforms", "object", "The template transforms.")
                .field ("parent", "nit.cache.Entry", "The parent entry.")
            ;
        })

        .method ("buildValue", async function (ctx)
        {
            let { openTag, closeTag, httpContext, parent } = ctx;
            let content = await nit.readFileAsync (this.tags.path);

            if (~content.indexOf (openTag)
                && ~content.indexOf (closeTag))
            {
                let transforms = nit.assign ({ nit }, ctx.transforms);
                let template = new nit.Template (content, ctx);

                content = await template.render (httpContext, nit.assign ({ $: transforms }, ctx, { parent: this }));
            }

            if (parent)
            {
                parent.addDependency (this);
            }

            let lastModified = httpContext.responseHeader ("Last-Modified");
            let mtime = this.tags.mtime;

            if (!lastModified || lastModified < mtime)
            {
                httpContext.responseHeader ("Last-Modified", mtime);
            }

            return content;
        })
    ;
};
