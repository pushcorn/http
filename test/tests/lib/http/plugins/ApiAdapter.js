test.method ("http.plugins.ApiAdapter", "usedBy")
    .should ("throw if the host class is not a subclass of http.Api")
        .up (s => s.args = nit.defineClass ("A"))
        .throws ("error.invalid_host_class")
        .commit ()
;


test.plugin ("http:api-adapter", "dispatch")
    .should ("throw if the runTarget hook was not implemented")
        .init (s => s.hostClass = s.http.defineApi ("MyApi"))
        .init (s => s.hostClassName = "")
        .givenContext ()
        .throws ("error.lifecycle_hook_not_implemented")
        .commit ()

    .should ("send the text response if the result is a string")
        .init (s => s.called = [])
        .init (s => s.hostClass = s.http.defineApi ("MyApi"))
        .init (s => s.hostClassName = "")
        .up (s => s.hostClass
            .onRunTarget (() =>
            {
                s.called.push ("runMyApi");

                return "OK";
            })
        )
        .givenContext ()
        .expectingPropertyToBeOfType ("result.response", "http.responses.Text")
        .expectingPropertyToBe ("result.response.text", "OK")
        .expectingPropertyToBe ("called", ["runMyApi"])
        .commit ()

    .should ("send the JSON response if the result is not text")
        .init (s => s.called = [])
        .init (s => s.hostClass = s.http.defineApi ("MyApi"))
        .init (s => s.hostClassName = "")
        .up (s => s.hostClass
            .onRunTarget (() =>
            {
                s.called.push ("runMyApi");

                return { ok: true };
            })
        )
        .givenContext ()
        .expectingPropertyToBeOfType ("result.response", "http.responses.Json")
        .expectingPropertyToBe ("result.response.json", { ok: true })
        .expectingPropertyToBe ("called", ["runMyApi"])
        .commit ()

    .should ("send the first response type if defined")
        .init (s => s.called = [])
        .init (s => s.hostClass = s.http.defineApi ("MyApi")
            .defineResponse ("MyResponse", Response =>
            {
                Response
                    .field ("<ok>", "boolean")
                ;
            })
        )
        .init (s => s.hostClassName = "")
        .up (s => s.hostClass
            .onRunTarget (() =>
            {
                s.called.push ("runMyApi");

                return true;
            })
            .postNsInvoke ()
        )
        .givenContext ()
        .expectingPropertyToBeOfType ("result.response", "http.apis.MyApi.MyResponse")
        .expectingPropertyToBe ("result.response.ok", true)
        .expectingPropertyToBe ("called", ["runMyApi"])
        .commit ()
;
