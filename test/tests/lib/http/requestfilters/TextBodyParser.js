const { Readable } = require ("stream");
const Context = nit.require ("http.Context");


test.method ("http.requestfilters.TextBodyParser", "apply")
    .should ("parse the text request body")
        .given ({ requestStream: Readable.from (Buffer.from ("content")) })
        .expectingPropertyToBe ("args.0.requestBody", "content")
        .commit ()
;


test.method ("http.requestfilters.TextBodyParser", "applicableTo")
    .should ("return %{result} if the request content type is %{args[0].req.headers['content-type']}")
        .given (Context.new ())
        .returns (false)
        .commit ()

    .given (Context.new ({ headers: { "content-type": "text/csv" } }))
        .returns (true)
        .commit ()
;
