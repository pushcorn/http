test.plugin ("http.TemplateLoader", "loadTemplate", { registerPlugin: true, addPlugin: "instance" })
    .should ("load the template")
        .init (s => s.pluginArgs =
        {
            transforms: nit.new ("http.templatetransforms.Include")
        })
        .before (s => s.args =
        [
            nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-one.html"),
            s.http.Context.new (null,
            {
                assetResolvers: nit.new ("http.AssetResolver", { roots: "resources/html" })
            })
        ])
        .returns (nit.trim.text`
            This is page one.
            This is page two!
        ` + "\n\n")
        .commit ()
;


test.method ("http.TemplateLoader", "load")
    .should ("return the cached file content")
        .up (s => s.createArgs =
        {
            transforms: nit.new ("http.templatetransforms.Include")
        })
        .before (s => s.args =
        [
            nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-one.html"),
            s.http.Context.new (null,
            {
                assetResolvers: nit.new ("http.AssetResolver", { roots: "resources/html" })
            })
        ])
        .returns (nit.trim.text`
            This is page one.
            This is page two!
        ` + "\n\n")
        .commit ()

    .should ("throw if the template cannot be found")
        .up (s => s.createArgs =
        {
            transforms: nit.new ("http.templatetransforms.Include")
        })
        .before (s => s.args =
        [
            nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-1.html"),
            s.http.Context.new (null,
            {
                assetResolvers: nit.new ("http.AssetResolver", { roots: "resources/html" })
            })
        ])
        .throws ("error.invalid_path")
        .commit ()

    .should ("return undefined if the file extension is not supported")
        .up (s => s.createArgs =
        {
            extensions: ".css",
            transforms: nit.new ("http.templatetransforms.Include")
        })
        .before (s => s.args =
        [
            nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-1.html"),
            s.http.Context.new (null,
            {
                assetResolvers: nit.new ("http.AssetResolver", { roots: "resources/html" })
            })
        ])
        .returns ()
        .commit ()

    .should ("not update the Last-Modified header if it's more recent than the file's modification time")
        .up (s => s.createArgs =
        {
            transforms: nit.new ("http.templatetransforms.Include")
        })
        .before (s => s.args =
        [
            nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-one.html"),
            s.http.Context.new (null,
            {
                assetResolvers: nit.new ("http.AssetResolver", { roots: "resources/html" })
            })
        ])
        .before (s => s.args[1].responseHeader ("Last-Modified", new Date ()))
        .commit ()
;
