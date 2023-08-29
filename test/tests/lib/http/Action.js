test.method ("http.Action.Descriptor", "build")
    .should ("add the conditions for the specified endpoint")
        .up (s =>
        {
            s.createArgs = { endpoint: "POST /items" };
        })
        .expectingPropertyToBe ("result.constructor.conditions.length", 2)
        .expectingPropertyToBe ("result.constructor.conditions.0.method", "POST")
        .expectingPropertyToBe ("result.constructor.conditions.1.path", "/items")
        .commit ()

    .should ("add the specified filters")
        .up (s =>
        {
            s.createArgs =
            {
                requestFilters: "http:json-body-parser",
                responseFilters: "http:body-compressor"
            };
        })
        .expectingPropertyToBe ("result.requestFilters.length", 1)
        .expectingPropertyToBe ("result.responseFilters.length", 1)
        .commit ()
;


test.method ("http.Action", "dispatch")
    .should ("process the request")
        .up (s => s.class = s.http
            .defineAction ("Test", true)
            .onRun (ctx => ctx.root.processed = true)
        )
        .givenContext ()
        .returns ()
        .expectingPropertyToBe ("args.0.processed", true)
        .expectingPropertyToBeOfType ("args.0.request", "http.actions.Test.Request")
        .commit ()
;
