module.exports = function (nit)
{
    return nit.definePlugin ("http.plugins.TemplateLoader")
        .staticMethod ("onUsePlugin", function (hostCls)
        {
            hostCls
                .field ("templateLoaders...", "http.TemplateLoader", "The asset resolvers.")

                .do ("Descriptor", Descriptor =>
                {
                    let onConfigure = Descriptor[Descriptor.kConfigure];

                    Descriptor
                        .field ("templateLoaders...", "http.TemplateLoader.Descriptor", "The asset resolvers.")
                        .onConfigure (function (host)
                        {
                            onConfigure?.call (this, host);

                            host.templateLoaders.push (...this.templateLoaders.map (l => l.build ()));
                        })
                    ;
                })

                .method ("loadTemplate", async function (file, ctx)
                {
                    for (let loader of this.templateLoaders)
                    {
                        let t = await loader.load (file, ctx);

                        if (t)
                        {
                            return t;
                        }
                    }
                })
            ;
        })
    ;
};
