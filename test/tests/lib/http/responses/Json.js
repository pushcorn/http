const Context = nit.require ("http.Context");


test.method ("http.responses.Json", "toBody",
    {
        createArgs: { json: { a: 1 } }
    })
    .should ("return the JSON content")
    .given (Context.new ())
    .returns (JSON.stringify ({ a: 1 }))
    .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "application/json")
    .commit ()
;


