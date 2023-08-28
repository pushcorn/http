module.exports = function (nit, http)
{
    return http.defineTemplateTransform ("Include")
        .m ("error.file_not_found", "The template file '%{path}' was not found.")
        .onTransform (async function (ctx, path)
        {
            let file = await ctx.httpContext.resolveAsset (path);

            if (!file)
            {
                this.throw ("error.file_not_found", { path });
            }

            return await ctx.cache.fetch (file, ctx);
        })
    ;
};
