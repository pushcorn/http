const http = nit.require ("http");


test.object ("http.mocks.IncomingMessage")
    .should ("be an instance of http.IncomingMessage")
        .given ("GET", "/users/")
        .expecting ("the object is an instance of http.IncomingMessage", true, s => s.result instanceof http.IncomingMessage)
        .expectingPropertyToBe ("result.pathname", "/users")
        .expectingPropertyToBe ("result.path", "/users")
        .commit ()

    .should ("add the _read method if the data is provided")
        .given ("GET", "/users/", { data: { name: "u" } })
        .mock ("result", "push")
        .after (s => s.result._read ())
        .expectingPropertyToBe ("mocks.0.invocations.length", 2)
        .commit ()

    .should ("use the provided data buffer in _read")
        .given ("GET", "/users/", { data: Buffer.from ("ABCD") })
        .mock ("result", "push")
        .after (s => s.result._read ())
        .expectingPropertyToBe ("mocks.0.invocations.length", 2)
        .commit ()
;
