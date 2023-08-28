module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.TemplateLoader"))
        .use ("http.utils.ExtensionMatcher")
        .mixin ("http:describable")
        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .meta ("fieldsAsOptions", true)
                .field ("extensions...", "string", "The file extensions of the templates to be loaded.")
                .field ("openTag", "string?", "The template open tag.")
                .field ("closeTag", "string?", "The template close tag.")
                .field ("transforms...", "http.TemplateTransform.Descriptor", "The template transforms.", ["http:include"])
                .onConfigure (function (loader)
                {
                    loader.transforms = this.transforms.map (t => t.build ());
                })
            ;
        })
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
        .defineInnerClass ("CacheEntry", "nit.cache.entries.File", CacheEntry =>
        {
            CacheEntry
                .onBuildValue (async function (ctx)
                {
                    let self = this;
                    let { openTag, closeTag, httpContext, parent } = ctx;
                    let content = await nit.readFileAsync (self.tags.path);

                    if (~content.indexOf (openTag)
                        && ~content.indexOf (closeTag))
                    {
                        let template = new nit.Template (content, ctx);
                        let childCtx = new Self.Context (nit.assign ({}, ctx, { parent: self }));

                        content = await template.render (httpContext, childCtx);
                    }

                    if (parent)
                    {
                        parent.addDependency (self);
                    }

                    let lastModified = httpContext.responseHeader ("Last-Modified");
                    let mtime = self.tags.mtime;

                    if (!lastModified || lastModified < mtime)
                    {
                        httpContext.responseHeader ("Last-Modified", mtime);
                    }

                    return content;
                })
            ;
        })
        .field ("extensions...", "string", "The file name extensions to be resolved.")
        .field ("openTag", "string", "The template open tag.", "{%")
        .field ("closeTag", "string", "The template close tag.", "%}")
        .field ("transforms...", "http.TemplateTransform", "The template transforms.")

        .memo ("cache", function ()
        {
            return nit.new ("nit.Cache", Self.CacheEntry.name);
        })
        .memo ("extensionMatcher", function ()
        {
            return new Self.ExtensionMatcher (...this.extensions);
        })
        .memo ("transformMap", function ()
        {
            return this.transforms.reduce (function (a, t)
            {
                a[nit.lcFirst (t.constructor.simpleName)] = function ()
                {
                    let ctx = new Self.Context (this);

                    return t.transform (ctx, ...arguments);
                };

                return a;

            }, {});
        })
        .method ("load", async function (path, httpContext)
        {
            let self = this;

            if (!this.extensionMatcher.match (path))
            {
                return;
            }

            let { cache, openTag, closeTag, transformMap: transforms } = self;
            let context = new Self.Context (
            {
                httpContext,
                cache,
                openTag,
                closeTag,
                transforms
            });

            return await cache.fetch (path, context);
        })
    ;
};
