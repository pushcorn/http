test.method ("http.services.AutoRestart", "applicableTo")
    .should ("return false")
    .given ({})
    .returns (false)
    .commit ()
;


test.method ("http.services.AutoRestart", "start")
    .should ("start the file watcher and exit the server on file change")
    .application ()
    .up (async function ()
    {
        this.createArgs =
        [
        {
            assets: ["nit.local.json", test.TEST_PROJECT_PATH],
            delay: 10
        }
        ];
    })
    .before (function ()
    {
        nit.ASSET_PATHS.unshift (process.cwd ());

        this.configFile = nit.new ("nit.File", nit.path.join (process.cwd (), "nit.local.json"));

        this.configFile.write ("{}");
        this.object.server = nit.new ("http.Server");
    })
    .after (async function ()
    {
        await nit.sleep (100);

        this.configFile.write (JSON.stringify ({ a: 1 }));

        await nit.sleep (200);
        await this.object.stop ();
    })
    .mock (process, "exit")
    .mock (nit, "beep")
    .mock ("object.server", "stop")
    .expectingPropertyToBe ("mocks.0.invocations.0.args.0", 64)
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", 3)
    .expectingPropertyToBe ("mocks.2.invocations.length", 1)
    .commit ()
;

