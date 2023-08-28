test.method ("http.templatetransforms.Include", "transform")
    .should ("fetch the included file from the cache")
        .up (s => s.TemplateLoader = nit.require ("http.TemplateLoader"))
        .up (s => s.args =
        [
            new s.TemplateLoader.Context (
            {
                httpContext: s.http.Context.new ({},
                {
                    assetResolvers: { roots: "resources/html" }
                }),
                cache: nit.new ("nit.Cache", s.TemplateLoader.CacheEntry.name)
            })
            ,
            "page-two.html"
        ])
        .returns (`This is page two!\n`)
        .commit ()

    .should ("throw if the file was not found")
        .up (s => s.args =
        [
            new s.TemplateLoader.Context (
            {
                httpContext: s.http.Context.new ({},
                {
                    assetResolvers: { roots: "resources/public" }
                }),
                cache: nit.new ("nit.Cache", s.TemplateLoader.CacheEntry.name)
            })
            ,
            "page-two.html"
        ])
        .throws ("error.file_not_found")
        .commit ()
;
