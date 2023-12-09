test.method ("http.apis.GetApiSpec", "run")
    .should ("return the API spec")
        .givenContext ()
        .before (async (s) =>
        {
            s.service = s.createService ("http:api-server");
            s.object.service = s.service;
            s.service.apis = "http:get-api-spec";

            await s.object.start ();
        })
        .expectingPropertyToBeOfType ("args.0.response", "http.responses.ApiSpecReturned")
        .expectingPropertyJsonToBe ("args.0.response", __filename)
        .commit ()
;
