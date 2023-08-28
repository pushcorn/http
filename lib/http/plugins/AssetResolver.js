module.exports = function (nit)
{
    return nit.definePlugin ("http.plugins.AssetResolver")
        .staticMethod ("onUsePlugin", function (hostCls)
        {
            hostCls
                .field ("assetResolvers...", "http.AssetResolver", "The asset resolvers.")

                .do ("Descriptor", Descriptor =>
                {
                    let onConfigure = Descriptor[Descriptor.kConfigure];

                    Descriptor
                        .field ("assetResolvers...", "http.AssetResolver.Descriptor", "The asset resolvers.")
                        .onConfigure (function (host)
                        {
                            onConfigure?.call (this, host);

                            host.assetResolvers.push (...this.assetResolvers.map (r => r.build ()));
                        })
                    ;
                })

                .method ("resolveAsset", async function (file)
                {
                    for (let resolver of this.assetResolvers)
                    {
                        let f = await resolver.resolve (file);

                        if (f)
                        {
                            return f;
                        }
                    }
                })
            ;
        })
    ;
};
