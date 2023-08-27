module.exports = function (nit, http, Self)
{
    return (Self = http.defineService ("FileServer"))
        .use ("http.AssetResolver")
        .use ("http.TemplateLoader")
        .use ("http.MimeType")
        .field ("[template]", "boolean", "Whether the files to be served are templates.")
        .field ("extensions...", "string", "The template file extensions.")
        .field ("indexes...", "string", "The index files.", "index.html")

        .do ("Descriptor", Descriptor =>
        {
            let onConfigure = Descriptor[Descriptor.kConfigure];

            Descriptor
                .onConfigure (function (service)
                {
                    onConfigure.call (this, service);

                    if (!service.assetResolvers.length)
                    {
                        service.assetResolvers.push (Self.AssetResolver.Descriptor.build (
                        {
                            roots: "public"
                        }));
                    }

                    if (service.template && !service.templateLoaders.length)
                    {
                        service.templateLoaders.push (Self.TemplateLoader.Descriptor.build (
                        {
                            extensions: service.extensions
                        }));
                    }
               })
            ;
        })
        .onPostDispatch (async function (ctx)
        {
            if (!nit.is.undef (ctx.response))
            {
                return;
            }

            let { template, indexes } = this;
            let path = ctx.path;
            let paths = nit.is.empty (nit.trim (path, "/")) ? indexes : [path];

            for (path of paths)
            {
                if ((path = await ctx.resolveAsset (path)))
                {
                    if (template
                        && (template = await ctx.loadTemplate ("file://" + path)))
                    {
                        ctx.sendText (template, Self.MimeType.lookupName (path));
                    }
                    else
                    {
                        ctx.sendFile (path);
                    }

                    break;
                }
            }
        })
    ;
};
