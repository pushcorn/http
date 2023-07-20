const Context = nit.require ("http.Context");


test.object ("http.responses.RequestSucceeded")
    .should ("have the data field")
        .given ({ data: { a: 1 } })
        .expectingPropertyToBe ("result.data", { a: 1 })
        .commit ()
;


test.method ("http.responses.RequestSucceeded", "toBody", { createArgs: { data: { a: 1 }, dataOnly: true } })
    .should ("return the data as the body if dataOnly is true")
        .given (Context.new ())
        .returns (`{"a":1}`)
        .commit ()
;


test.method ("http.responses.RequestSucceeded", "toBody", { createArgs: { data: { a: 1 } } })
    .should ("return the all data if dataOnly is false")
        .given (Context.new ())
        .returns (`{"data":{"a":1}}`)
        .commit ()
;
