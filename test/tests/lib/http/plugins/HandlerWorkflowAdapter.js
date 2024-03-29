test.plugin ("http:handler-workflow-adapter", "dispatch")
    .should ("run the adapated workflow")
        .project ("project-a", true, true)
        .init (s => s.hostClass = s.http.defineHandler ("MyHandler"))
        .init (s => s.hostClassName = "")
        .init (s => s.pluginArgs = "nit:echo-test")
        .mock (nit, "log")
        .givenContext ()
        .expectingPropertyToBeOfType ("result.response", "http.responses.Text")
        .expectingPropertyToBe ("result.response.text", "test 2 false")
        .expectingPropertyToBe ("mocks.0.invocations.length", 2)
        .commit ()
;
