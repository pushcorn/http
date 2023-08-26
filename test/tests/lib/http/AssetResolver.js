test.method ("http.AssetResolver.Descriptor", "build")
    .should ("return an AssetResolver")
        .up (s => s.createArgs =
        {
            extensions: ".png",
            roots: nit.path.join (test.TEST_PROJECT_PATH, "resources")
        })
        .returnsInstanceOf ("http.AssetResolver")
        .expectingPropertyToBe ("result.extensions", [".png"])
        .expectingPropertyToBe ("result.roots", [nit.path.join (test.TEST_PROJECT_PATH, "resources")])
        .commit ()
;


test.method ("http.AssetResolver", "resolve")
    .should ("return the absolute path of a file under the specified root directories")
        .up (s => s.createArgs = { roots: nit.path.join (test.TEST_PROJECT_PATH, "resources") })
        .given ("html/page-one.html")
        .returns (nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-one.html"))
        .commit ()

    .should ("return undefined if the file cannot be found")
        .up (s => s.createArgs = { roots: nit.path.join (test.TEST_PROJECT_PATH, "resources") })
        .given ("html/page-three.html")
        .returns ()
        .commit ()

    .should ("return undefined if the file does not match the specifed extension")
        .up (s => s.createArgs =
        {
            extensions: ".png",
            roots: nit.path.join (test.TEST_PROJECT_PATH, "resources"),
        })
        .given ("html/page-one.html")
        .returns ()
        .commit ()
;
