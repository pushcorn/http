const Context = nit.require ("http.Context");


test.method ("http.responses.Noop", "toBody")
    .should ("have the status code set to 0")
        .given (Context.create ())
        .returns (JSON.stringify ({ "@name": "Noop", "@status": 0, "@message": "The response will be handled manually." }))
        .commit ()
;
