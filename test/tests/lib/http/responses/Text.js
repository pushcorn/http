const Context = nit.require ("http.Context");


test.method ("http.responses.Text", "toBody",
    {
        createArgs: "this is the text content"
    })
    .should ("return the text content")
    .given (Context.create ())
    .returns ("this is the text content")
    .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/plain")
    .commit ()
;


