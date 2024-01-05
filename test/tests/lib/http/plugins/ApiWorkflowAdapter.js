test.plugin ("http:api-workflow-adapter", "dispatch")
    .should ("run the adapated workflow")
        .project ("project-a", true, true)
        .init (s => s.hostClass = s.http.defineApi ("MyApi")
            .defineResponse ("MyResponse", MyResponse =>
            {
                MyResponse
                    .field ("<message>", "string")
                ;
            })
        )
        .init (s => s.hostClassName = "")
        .init (s => s.pluginArgs = "nit:echo-test")
        .mock (nit, "log")
        .givenContext ()
        .expectingPropertyToBeOfType ("result.response", "http.apis.MyApi.MyResponse")
        .expectingPropertyToBe ("result.response.message", "test 2 false")
        .expectingPropertyToBe ("mocks.0.invocations.length", 2)
        .commit ()
;
