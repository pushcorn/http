const { Readable } = require ("stream");


test.method ("http.RequestFilter.Descriptor", "build", true)
    .should ("return an instance of http.RequestFilter")
        .given ("http:json-body-parser")
        .returnsInstanceOf ("http.requestfilters.JsonBodyParser")
        .commit ()

    .should ("adds the specified conditions to the filter class")
        .given ("http:json-body-parser",
        {
            conditions:
            {
                name: "http:request-method",
                options: "POST"
            }
        })
        .returnsInstanceOf ("http.requestfilters.JsonBodyParser")
        .expectingPropertyToBe ("result.constructor.conditions.length", 1)
        .expectingPropertyToBeOfType ("result.constructor.conditions.0", "http.conditions.RequestMethod")
        .commit ()
;


test.method ("http.RequestFilter", "parseStream", true)
    .should ("parse the stream with the given encoding")
        .given (Readable.from (Buffer.from ("test")))
        .returns (Buffer.from ("test"))
        .commit ()

    .given (Readable.from (Buffer.from ("test")), "utf8")
        .returns ("test")
        .commit ()

    .should ("throw the status code if the erro has the status property")
        .given (Readable.from (Buffer.from ("test")), "unsupported")
        .throws (415)
        .commit ()

    .should ("throw if the parsing failed")
        .given (Readable.from (Buffer.from ("test")), "unsupported")
        .mock (require ("bytes"), "parse", function ()
        {
            throw new Error ("ERR!");
        })
        .throws (/ERR!/)
        .commit ()
;


test.method ("http.RequestFilter", "readBodyAsBuffer", true)
    .should ("read the request stream as a buffer")
    .given ({ requestStream: Readable.from (Buffer.from ("test")) })
    .returns (Buffer.from ("test"))
    .commit ()
;


test.method ("http.RequestFilter", "readBodyAsString", true)
    .should ("read the request stream as a string")
        .given ({ requestStream: Readable.from (Buffer.from ("test")) })
        .returns ("test")
        .commit ()

    .given ({ requestStream: Readable.from (Buffer.from ("test")) }, "base64")
        .returns ("dGVzdA==")
        .commit ()
;
