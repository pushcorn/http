test.command ("http.commands.Server")
    .should ("create and start an instance of http.Server")
    .mock (nit, "log")
    .given (
    {
        port: 0,
        stopTimeout: 0
    })
    .after (async function ()
    {
        this.port = this.object.server.realPort;

        await this.object.server.stop ();
    })
    .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /server started/)
    .expectingPropertyToBe ("port", /\d+/)
    .commit ()
;
