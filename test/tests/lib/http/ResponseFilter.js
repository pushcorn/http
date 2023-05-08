const { Readable } = require ("stream");


test.method ("http.ResponseFilter", "readBodyAsString", true)
    .should ("parse the response buffer into a string")
        .given ({ responseBody: Buffer.from ("test") })
        .returns ("test")
        .commit ()

    .should ("parse the response stream into a string")
        .given ({ responseBody: Readable.from (Buffer.from ("test")) })
        .returns ("test")
        .commit ()

    .should ("parse the response data into a string")
        .given ({ responseBody: 1 })
        .returns ("1")
        .commit ()
;
