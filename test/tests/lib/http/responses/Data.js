const Context = nit.require ("http.Context");


test.method ("http.responses.Data", "toBody")
    .should ("return the data content")
        .up (s => s.createArgs = Buffer.from ("abcd"))
        .given (Context.new ())
        .returns (Buffer.from ("abcd"))
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "application/octet-stream")
        .commit ()

    .up (s => s.createArgs = "xyz")
        .given (Context.new ())
        .returns ("xyz")
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "application/octet-stream")
        .commit ()
;


