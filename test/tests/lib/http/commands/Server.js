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

    .should ("not return the server if meta property returnServer is false")
        .mock (nit, "log")
        .before (s => s.class.returnServer = false)
        .given (
        {
            port: 0,
            stopTimeout: 0
        })
        .after (async (s) =>
        {
            await nit.sleep (20);
            await s.object.server.stop ();
            await nit.sleep (20);
        })
        .returns ("")
        .commit ()

    .should ("accept custom root")
        .mock (nit, "log")
        .before (s => s.class.returnServer = true)
        .given (
        {
            port: 0,
            stopTimeout: 0,
            root: "."
        })
        .after (async (s) =>
        {
            await nit.sleep (20);
            await s.object.server.stop ();
            await nit.sleep (20);
        })
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBe ("result.hosts.0.services.0.assetResolvers.0.assetResolver.roots", [nit.path.join (test.TEST_PROJECT_PATH, "..")])
        .commit ()

    .should ("accept custom descriptor")
        .mock (nit, "log")
        .before (s => s.class.returnServer = true)
        .given (
        {
            port: 0,
            stopTimeout: 0,
            descriptor:
            {
                services: "http:file-server"
            }
        })
        .after (async (s) =>
        {
            await nit.sleep (20);
            await s.object.server.stop ();
            await nit.sleep (20);
        })
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBeOfType ("result.hosts.0.services.0", "http.services.FileServer")
        .commit ()
;
