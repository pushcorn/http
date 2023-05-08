const { Readable } = require ("stream");


test.method ("http.requestfilters.JsonBodyParser", "apply")
    .should ("parse the request body as a JSON object")
        .given ({ requestStream: Readable.from (Buffer.from (`{"a": 1}`)) })
        .expectingPropertyToBe ("args.0.requestBody", { a: 1 })
        .commit ()

    .should ("throw if the JSON stream is invalid")
        .given ({ requestStream: Readable.from (Buffer.from (`{'a': 1}`)) })
        .throws (function (error)
        {
            return error instanceof this.class.InvalidJson;
        })
        .commit ()
;
