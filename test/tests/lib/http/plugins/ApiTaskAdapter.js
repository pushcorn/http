test.plugin ("http:api-task-adapter", "dispatch")
    .should ("run the adapated task")
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
        .init (s => s.pluginArgs = "nit:say-hello")
        .givenContext ({ data: { message: "There" } })
        .expectingPropertyToBeOfType ("result.response", "http.apis.MyApi.MyResponse")
        .expectingPropertyToBe ("result.response.message", "Hello There!")
        .commit ()
;
