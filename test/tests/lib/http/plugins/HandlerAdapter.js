test.method ("http.plugins.HandlerAdapter", "usedBy")
    .should ("throw if the host class is not a subclass of http.Handler")
        .up (s => s.args = nit.defineClass ("A"))
        .throws ("error.invalid_host_class")
        .commit ()
;


test.plugin ("http:handler-adapter", "run")
    .should ("throw if the runTarget hook was not implemented")
        .init (s => s.hostClass = s.http.defineHandler ("MyHandler"))
        .init (s => s.hostClassName = "")
        .givenContext ()
        .throws ("error.lifecycle_hook_not_implemented")
        .commit ()

    .should ("send the JSON response if the result is not text")
        .init (s => s.called = [])
        .init (s => s.hostClass = s.http.defineHandler ("MyHandler"))
        .init (s => s.hostClassName = "")
        .up (s => s.hostClass
            .onRunTarget (() =>
            {
                s.called.push ("runMyHandler");

                return { ok: true };
            })
        )
        .givenContext ()
        .expectingPropertyToBeOfType ("result.response", "http.responses.Json")
        .expectingPropertyToBe ("result.response.json", { ok: true })
        .expectingPropertyToBe ("called", ["runMyHandler"])
        .commit ()

    .should ("send the text response if the result is string")
        .init (s => s.called = [])
        .init (s => s.hostClass = s.http.defineHandler ("MyHandler"))
        .init (s => s.hostClassName = "")
        .up (s => s.hostClass
            .onRunTarget (() =>
            {
                s.called.push ("runMyHandler");

                return "OK";
            })
        )
        .givenContext ()
        .expectingPropertyToBeOfType ("result.response", "http.responses.Text")
        .expectingPropertyToBe ("result.response.text", "OK")
        .expectingPropertyToBe ("called", ["runMyHandler"])
        .commit ()

    .should ("NOT send the result if the response has been set")
        .init (s => s.called = [])
        .init (s => s.hostClass = s.http.defineHandler ("MyHandler"))
        .init (s => s.hostClassName = "")
        .up (s => s.hostClass
            .onRunTarget (() =>
            {
                s.called.push ("runMyHandler");

                return "DATA";
            })
        )
        .givenContext ()
        .expectingPropertyToBeOfType ("result.response", "http.responses.Text")
        .expectingPropertyToBe ("called", ["runMyHandler"])
        .commit ()

    .should ("NOT set the response if result is undef")
        .init (s => s.called = [])
        .init (s => s.hostClass = s.http.defineHandler ("MyHandler"))
        .init (s => s.hostClassName = "")
        .up (s => s.hostClass
            .onRunTarget (() =>
            {
                s.called.push ("runMyHandler");
            })
        )
        .givenContext ()
        .expectingPropertyToBe ("result.response")
        .expectingPropertyToBe ("called", ["runMyHandler"])
        .commit ()
;


test.plugin ("http:handler-adapter", "buildRequest", true)
    .should ("import the parameters and update their source type")
        .init (s => s.GetUser = nit.defineClass ("GetUser")
            .field ("<id>", "string", "The user ID.")
            .field ("enabled", "boolean", "Enabled accounts only.")
        )
        .init (s => s.hostClass = s.http.defineHandler ("MyHandler")
            .endpoint ("GET /users/:id")
        )
        .init (s => s.hostClassName = "")
        .up (s => s.args = [s.GetUser.fields])
        .expectingPropertyToBe ("hostClass.Request.parameters.length", 2)
        .expectingPropertyToBe ("hostClass.Request.parameters.0.source", "path")
        .expectingPropertyToBe ("hostClass.Request.parameters.1.source", "query")
        .commit ()

    .reset ()
        .init (s => s.UpdateUser = nit.defineClass ("UpdateUser")
            .field ("<id>", "string", "The user ID.")
            .field ("enabled", "boolean", "Enabled accounts only.")
        )
        .init (s => s.hostClass = s.http.defineHandler ("MyHandler")
            .endpoint ("POST /users/:id")
        )
        .init (s => s.hostClassName = "")
        .up (s => s.args = [s.GetUser.fields])
        .expectingPropertyToBe ("hostClass.Request.parameters.length", 2)
        .expectingPropertyToBe ("hostClass.Request.parameters.0.source", "path")
        .expectingPropertyToBe ("hostClass.Request.parameters.1.source", "form")
        .commit ()
;
