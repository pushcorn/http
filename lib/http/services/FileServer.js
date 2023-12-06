module.exports = function (nit, http, Self)
{
    return (Self = http.defineService ("FileServer"))
        .use ("http.MimeType")
        .field ("[template]", "boolean", "Whether the files to be served are templates.")
        .field ("extensions...", "string", "The template file extensions.")
        .field ("indexes...", "string", "The index files.", "index.html")

        .onPreInit (function ()
        {
            let self = this;

            if (!self.assetresolvers.length)
            {
                self.assetresolvers.push ({ roots: "public" });
            }

            if (self.template && !self.templateloaders.length)
            {
                self.templateloaders.push ({ extensions: self.extensions });
            }
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
