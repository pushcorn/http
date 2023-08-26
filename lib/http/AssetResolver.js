module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.AssetResolver"))
        .use ("http.utils.ExtensionMatcher")
        .mixin ("http:describable")
        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .meta ("fieldsAsOptions", true)
                .field ("extensions...", "string", "The file name extensions to be resolved.")
                .field ("roots...", "dir", "The root directories under which the file should be located.")
            ;
        })
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
    ;
};
