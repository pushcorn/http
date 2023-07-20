const { Readable } = require ("stream");
const Context = nit.require ("http.Context");


test.method ("http.requestfilters.UrlEncodedBodyParser", "apply")
    .should ("parse URL-encoded body")
        .given ({ requestStream: Readable.from (Buffer.from ("a=1&b=2")) })
        .expectingPropertyToBe ("args.0.requestBody", { a: "1", b: "2" })
        .commit ()
;


test.method ("http.requestfilters.UrlEncodedBodyParser", "applicableTo")
    .should ("return %{result} if the request content type is %{args[0].req.headers['content-type']}")
        .given (Context.new ())
        .returns (false)
        .commit ()

    .given (Context.new ({ headers: { "content-type": "application/x-www-form-urlencoded" } }))
        .returns (true)
        .commit ()
;
