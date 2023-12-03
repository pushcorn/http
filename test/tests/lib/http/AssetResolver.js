test.plugin ("http.AssetResolver", "resolveAsset", { instancePluginAllowed: true, registerPlugin: true, addPlugin: "instance" })
    .should ("return the absolute path of a file under the specified root directories")
        .init (s => s.pluginArgs = { roots: nit.path.join (test.TEST_PROJECT_PATH, "resources") })
        .given ("html/page-one.html")
        .returns (nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-one.html"))
        .commit ()

    .should ("return undefined if the file cannot be found")
        .init (s => s.pluginArgs = { roots: nit.path.join (test.TEST_PROJECT_PATH, "resources") })
        .given ("html/page-three.html")
        .returns ()
        .commit ()

    .should ("return undefined if the file does not match the specifed extension")
        .init (s => s.pluginArgs =
        {
            extensions: ".png",
            roots: nit.path.join (test.TEST_PROJECT_PATH, "resources")
        })
        .given ("html/page-one.html")
        .returns ()
        .commit ()
;
