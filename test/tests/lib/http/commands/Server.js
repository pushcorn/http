const Server = nit.require ("http.Server");


test.command ("http.commands.Server")
    .should ("start the HTTP server")
        .mock (Server.prototype, "start")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("context.input.port", 80)
        .commit ()
;
