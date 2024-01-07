test.object ("http.test.strategies.Api")
    .should ("try to lookup the specified API")
        .given ("http:get-api-spec")
        .expectingPropertyToBe ("result.description", "API: http.apis.GetApiSpec")
        .commit ()
;


test.method ("http.test.strategies.Api", "testUp")
    .should ("initialize the context and object")
        .up (s => s.createArgs = "http:get-api-spec")
        .expectingPropertyToBe ("object.context.method", "GET")
        .expectingPropertyToBe ("object.context.path", "/")
        .expectingPropertyToBeOfType ("object.object", "http.apis.GetApiSpec")
        .commit ()
;


test.method ("http.test.strategies.Api", "testBefore")
    .should ("invoke applicableTo () on the API")
        .up (s => s.MyApi = s.http.defineApi ("MyApi")
            .endpoint ("GET /specs/:id")
        )
        .up (s => s.createArgs = ["http:my-api", "GET /specs/my"])
        .before (s => s.object.testUp ())
        .expectingPropertyToBe ("object.context.pathParams", { id: "my" })
        .commit ()
;


test.method ("http.test.strategies.Api", "test")
    .should ("call the API's dispatch method with the context")
        .up (s => s.createArgs = "http:get-api-spec")
        .before (s => s.object.testUp ())
        .mock ("object.object", "dispatch")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBeOfType ("mocks.0.invocations.0.args.0", "http.Context")
        .commit ()
;
