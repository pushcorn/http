test.method ("http.Etag", "forStat", true)
    .should ("generate a weak e-tag with file stats")
        .given (nit.fs.statSync (nit.resolveAsset ("package.json")))
        .returns (/^W\/"[0-9a-f]+-[0-9a-f]+"$/)
        .commit ()
;


test.method ("http.Etag", "forData", true)
    .should ("generate an e-tag for the given data")
        .given ("test")
        .returns ('"n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg-4"')
        .commit ()

    .given ()
        .returns ('"47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU-0"')
        .commit ()

    .given (100)
        .returns ('"rVc2aGUSblVknssjrh1IiHVEl27-pGpI612Fpu600wY-3"')
        .commit ()
;


test.method ("http.Etag", "forFile", true)
    .should ("generate an e-tag for the specified file")
        .given (nit.resolveAsset ("package.json"))
        .returns (/^W\/"[0-9a-f]+-[0-9a-f]+"$/)
        .commit ()

    .should ("throw if the file was not found")
        .given ("package.json2")
        .throws ("error.file_not_found")
        .commit ()
;
