test.method ("http.utils.ExtensionMatcher", "match")
    .should ("return false if the given file name does not match any of the specified extensions")
        .up (s => s.createArgs = [".png", "jpg"])
        .given ("ab/cd.html")
        .returns (false)
        .expectingPropertyToBe ("object.extensions", [".png", ".jpg"])
        .commit ()

    .should ("return true if the given file name matches one of the specified extensions")
        .up (s => s.createArgs = [".png", "html"])
        .given ("ab/cd.html")
        .returns (true)
        .commit ()
;
