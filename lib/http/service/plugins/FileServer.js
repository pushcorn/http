module.exports = function (nit, http)
{
    return http.service.definePlugin ("FileServer")
        .field ("[roots...]", "dir", "The root directories of the static files.",
        {
            defval: function ()
            {
                return nit.ASSET_PATHS.map (p => nit.path.join (p, "public"));
            }
        })
        .field ("indexes...", "string", "The index files.", ["index.html", "index.tpl.html"])

        .method ("resolve", async function (path)
        {
            try
            {
                let stats = await nit.fs.promises.stat (path);

                if (stats.isDirectory ())
                {
                    for (let index of this.indexes)
                    {
                        let file = await this.resolve (nit.path.join (path, index));

                        if (file)
                        {
                            return file;
                        }
                    }
                }
                else
                {
                    return path;
                }
            }
            catch (e)
            {
            }
        })

        .method ("postDispatch", async function (service, ctx)
        {
            if (!nit.is.undef (ctx.response))
            {
                return;
            }

            let path;

            for (let root of this.roots)
            {
                if ((path = await this.resolve (nit.path.join (root, ctx.path))))
                {
                    return ctx.response = nit.new ("http.responses.FileReturned", path);
                }
            }
        })
    ;
};
