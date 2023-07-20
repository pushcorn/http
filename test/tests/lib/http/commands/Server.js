test.command ("http.commands.Server")
    .should ("create and start an instance of http.Server")
    .mock (nit, "log")
    .given (
    {
        port: 0,
        stopTimeout: 0
    })
    .after (async (s) =>
    {
        await nit.sleep (20);

        s.port = s.result.realPort;

        await s.result.stop ();
        await nit.sleep (20);
    })
    .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /server started/)
    .expectingPropertyToBe ("port", /\d+/)
    .commit ()
;
