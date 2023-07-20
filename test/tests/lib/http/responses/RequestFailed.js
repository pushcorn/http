const Context = nit.require ("http.Context");


test.object ("http.responses.RequestFailed")
    .should ("have the code and data fields")
        .given ({ code: "error.password_too_short", data: { a: 1 } })
        .expectingPropertyToBe ("result.code", "error.password_too_short")
        .expectingPropertyToBe ("result.data", { a: 1 })
        .commit ()
;


test.method ("http.responses.RequestFailed", "toBody", { createArgs: { data: { a: 1 }, dataOnly: true } })
    .should ("return the data as the body if dataOnly is true")
        .given (Context.new ())
        .returns (`{"a":1}`)
        .commit ()
;


test.method ("http.responses.RequestFailed", "toBody", { createArgs: { data: { a: 1 } } })
    .should ("return the all data if dataOnly is false")
        .given (Context.new ())
        .returns (`{"data":{"a":1}}`)
        .commit ()
;
