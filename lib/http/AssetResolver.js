module.exports = function (nit, http, Self)
{
    return (Self = nit.definePlugin ("http.AssetResolver"))
        .meta ("unique", false)
        .use ("http.utils.ExtensionMatcher")
        .field ("extensions...", "string", "The file name extensions to be resolved.")
        .field ("roots...", "dir", "The root directories under which the file should be located.", nit.ASSET_PATHS)
        .memo ("assetResolver", function ()
        {
            return nit.new ("nit.AssetResolver", this.roots);
        })
        .memo ("extensionMatcher", function ()
        {
            return new Self.ExtensionMatcher (...this.extensions);
        })
        .method ("resolve", async function (file)
        {
            if (this.extensionMatcher.match (file))
            {
                return await this.assetResolver.resolve (file);
            }
        })
        .onRegisteredBy (function (hostClass)
        {
            hostClass
                .method ("resolveAsset", async function (file)
                {
                    let self = this;
                    let cls = self.constructor;

                    return nit.find.result (cls.getPlugins.call (self, "assetresolvers"), r => r.resolve (file));
                })
            ;
        })
    ;
};
