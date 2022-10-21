const { Readable } = require ("stream");
const Context = nit.require ("http.Context");


test.method ("http.request.filters.UrlEncodedBodyParser", "apply")
    .should ("parse URL-encoded body")
        .given ({ requestStream: Readable.from (Buffer.from ("a=1&b=2")) })
        .expectingPropertyToBe ("args.0.requestBody", { a: "1", b: "2" })
        .commit ()
;


test.method ("http.request.filters.UrlEncodedBodyParser", "appliesTo")
    .should ("return %{result} if the request content type is %{args[0].req.headers['content-type']}")
        .given (Context.create ())
        .returns (false)
        .commit ()

    .given (Context.create ({ headers: { "content-type": "application/x-www-form-urlencoded" } }))
        .returns (true)
        .commit ()
;
