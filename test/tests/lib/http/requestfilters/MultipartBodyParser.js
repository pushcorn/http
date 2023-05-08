const { Readable } = require ("stream");


test.method ("http.requestfilters.MultipartBodyParser", "apply")
    .should ("parse the multipart request")
        .given ({ requestStream: Readable.from (Buffer.from ("content")) })
        .mock ("class.formidable.IncomingForm.prototype", "parse", function (stream, cb)
        {
            cb (null, { a: 2 });
        })
        .expectingPropertyToBe ("args.0.requestBody", { fields: { a: 2 }, files: undefined })
        .commit ()

    .should ("throw if the parsing failed")
        .given ({ requestStream: Readable.from (Buffer.from ("content")) })
        .mock ("class.formidable.IncomingForm.prototype", "parse", function (stream, cb)
        {
            cb (new Error ("ERR!"));
        })
        .throws (/ERR!/)
        .commit ()
;
