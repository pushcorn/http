const Context = nit.require ("http.Context");


test.method ("http.responses.Noop", "toBody")
    .should ("have the status code set to 0")
        .given (Context.new ())
        .returns ("")
        .expectingPropertyToBe ("object.constructor.status", 0)
        .expectingPropertyToBe ("object.constructor.message", "OK")
        .commit ()
;
