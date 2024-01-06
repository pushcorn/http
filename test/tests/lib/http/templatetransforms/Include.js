test.method ("http.templatetransforms.Include", "transform")
    .should ("fetch the included file from the cache")
        .up (s => s.TemplateLoader = nit.require ("http.TemplateLoader"))
        .up (s => s.MyHandler = s.http.defineApi ("MyApi")
            .assetresolver ({ roots: "resources/html" })
        )
        .up (s => s.args =
        [
            new s.TemplateLoader.Context (
            {
                httpContext: s.http.Context.new (null, { handler: new s.MyHandler }),
                cache: nit.new ("nit.Cache", s.TemplateLoader.CacheEntry.name)
            })
            ,
            "page-two.html"
        ])
        .returns (`This is page two!\n`)
        .commit ()

    .should ("throw if the file was not found")
        .up (s => s.MyHandler = s.http.defineApi ("MyApi")
            .assetresolver ({ roots: "resources/public" })
        )
        .up (s => s.args =
        [
            new s.TemplateLoader.Context (
            {
                httpContext: s.http.Context.new (null, { handler: new s.MyHandler }),
                cache: nit.new ("nit.Cache", s.TemplateLoader.CacheEntry.name)
            })
            ,
            "page-two.html"
        ])
        .throws ("error.file_not_found")
        .commit ()
;
