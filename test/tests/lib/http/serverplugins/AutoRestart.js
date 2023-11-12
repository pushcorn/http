test.method ("http.serverplugins.AutoRestart", "postStart")
    .should ("start the file watcher and exit the server on file change")
    .application ()
    .up (s => s.createArgs =
    {
        assets: ["nit.local.json", test.TEST_PROJECT_PATH],
        delay: 10
    })
    .before (s =>
    {
        nit.ASSET_PATHS.unshift (process.cwd ());

        s.configFile = nit.new ("nit.File", nit.path.join (process.cwd (), "nit.local.json"));
        s.configFile.write ("{}");

        s.server = nit.new ("http.Server");
        s.args = s.server;
    })
    .after (async (s) =>
    {
        await nit.sleep (100);

        s.configFile.write (JSON.stringify ({ a: 1 }));

        await nit.sleep (200);
        await s.object.preStop (s.server);
    })
    .mock (process, "exit")
    .mock (nit, "beep")
    .mock ("server", "stop")
    .expectingPropertyToBe ("mocks.0.invocations.0.args.0", 64)
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", 3)
    .expectingPropertyToBe ("mocks.2.invocations.length", 1)
    .commit ()
;

