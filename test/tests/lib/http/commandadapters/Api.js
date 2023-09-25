const Colorizer = nit.require ("nit.utils.Colorizer");
const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");


test.method ("http.commandadapters.Api", "buildCommand", true)
    .should ("build the command from an API")
    .project ("myapp")
    .before (s => s.args = ["myapp.commands.Hello", new nit.ComponentDescriptor ("myapp.apis.Hello", "apis")])
    .before (async (s) =>
    {
        s.server = s.createServer (
        {
            services: "http:api-server"
        });
    })
    .mock ("server", "info")
    .mock (process.stderr, "write")
    .mock (process.stdout, "write", { iterations: 1 })
    .after (async (s) =>
    {
        await s.server.start ();
    })
    .after (async (s) =>
    {
        let commandTest = test.command ("myapp.commands.Hello");

        await commandTest.testUp ("John Doe", "Mr.", { xPort: s.server.realPort });

        s.helloResult1 = await commandTest.test ();
    })
    .after (async (s) =>
    {
        process.stdout.isTTY = false;

        let commandTest = test.command ("myapp.commands.Hello");

        await commandTest.testUp ("John Doe", "Mr.", { xPort: s.server.realPort });

        s.helloResult2 = await commandTest.test ();

        process.stdout.isTTY = true;
    })
    .after (async (s) =>
    {
        let commandTest = test.command ("myapp.commands.Hello");
        let Hello = s.result;

        Hello.Input.fieldMap.opt1.constraints.pop ();
        Hello.Input.fieldMap.opt1.constraint ("choice", "val1", "val2", "val3");

        await commandTest.testUp ("John Doe", "Mr.", { xPort: s.server.realPort, opt1: "val3" });

        s.helloResult3 = await commandTest.test ();
        s.exitCode3 = process.exitCode;

        process.exitCode = 0;
    })
    .after (async (s) =>
    {
        let commandTest = test.command ("myapp.commands.Hello");

        test.mock (s.http, "fetch", function ()
        {
            return {
                statusCode: 400,
                headers: {}
            };
        });

        await commandTest.testUp ("John Doe", "Mr.", { xPort: s.server.realPort, opt1: "val3" });

        s.helloResult4 = await commandTest.test ();
        s.exitCode4 = process.exitCode;

        process.exitCode = 0;
    })
    .deinit (async (s) =>
    {
        await nit.sleep (10);
        await s.server.stop ();
    })
    .returnsInstanceOf ("nit.Command", true)
    .expectingPropertyToBe ("result.name", "myapp.commands.Hello")
    .expectingPropertyToBeOfType ("result.Input.fieldMap.name", "nit.Command.Option")
    .expectingPropertyToBeOfType ("result.Input.fieldMap.xUrl", "nit.Command.Option")
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /200/)
    .expectingPropertyToBe ("helloResult1", Colorizer.gray (nit.toJson ({ message: "Hello Mr. John Doe!" }, "  ")))
    .expectingPropertyToBe ("mocks.2.invocations.0.args.0", /200/)
    .expectingPropertyToBe ("helloResult2", nit.toJson ({ message: "Hello Mr. John Doe!" }, "  "))
    .expectingPropertyToBe ("mocks.1.invocations.1.args.0", /400/)
    .expectingPropertyToBe ("helloResult3", /violations[\s\S]+opt1/)
    .expectingPropertyToBe ("exitCode3", 1)
    .expectingPropertyToBe ("helloResult4", undefined)
    .expectingPropertyToBe ("exitCode4", 1)
    .commit ()
;


test.method ("http.commandadapters.Api", "buildCommand", true)
    .should ("build the command that handles the binary response")
    .project ("myapp")
    .before (s => s.args = ["myapp.commands.GetBlob", new nit.ComponentDescriptor ("myapp.apis.GetBlob", "apis")])
    .before (async (s) =>
    {
        s.server = s.createServer (
        {
            services: "http:api-server"
        });
    })
    .mock ("server", "info")
    .mock (process.stderr, "write")
    .mock (process.stdout, "write", { iterations: 1 })
    .after (async (s) =>
    {
        await s.server.start ();
    })
    .after (async (s) =>
    {
        let commandTest = test.command ("myapp.commands.GetBlob");

        await commandTest.testUp ("The blob content.", { xPort: s.server.realPort });

        s.blobResult = await commandTest.test ();
    })
    .deinit (async (s) =>
    {
        await nit.sleep (10);
        await s.server.stop ();
    })
    .returnsInstanceOf ("nit.Command", true)
    .expectingPropertyToBe ("result.name", "myapp.commands.GetBlob")
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /200/)
    .expectingPropertyToBeOfType ("blobResult", "Buffer")
    .expectingMethodToReturnValue ("blobResult.toString", null, "The blob content.")
    .commit ()
;


test.method ("http.commandadapters.Api", "buildCommand", true)
    .should ("build the command that handles the object input")
    .project ("myapp")
    .before (s => s.args = ["myapp.commands.CheckIn", new nit.ComponentDescriptor ("myapp.apis.CheckIn", "apis")])
    .before (async (s) =>
    {
        s.server = s.createServer (
        {
            services: "http:api-server"
        });
    })
    .mock ("server", "info")
    .mock (process.stderr, "write")
    .mock (process.stdout, "write", { iterations: 1 })
    .after (async (s) =>
    {
        await s.server.start ();
    })
    .after (async (s) =>
    {
        let commandTest = test.command ("myapp.commands.CheckIn");

        await commandTest.testUp ("1234",
        {
            location: { latitude: 33, longitude: 44 },
            xPort: s.server.realPort
        });

        s.apiResult = await commandTest.test ();
    })
    .deinit (async (s) =>
    {
        await nit.sleep (10);
        await s.server.stop ();
    })
    .returnsInstanceOf ("nit.Command", true)
    .expectingPropertyToBe ("result.name", "myapp.commands.CheckIn")
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /201/)
    .commit ()
;


test.method ("http.commandadapters.Api", "buildCommand", true)
    .should ("build the command that handles the SSL connection")
    .project ("myapp")
    .before (s => s.args = ["myapp.commands.CheckIn", new nit.ComponentDescriptor ("myapp.apis.CheckIn", "apis")])
    .before (async (s) =>
    {
        s.server = s.createServer (
        {
            names: "app.pushcorn.com",
            services: "http:api-server",
            certificate:
            {
                cert: CERTS_DIR.join ("pushcorn.com.crt"),
                key: CERTS_DIR.join ("pushcorn.com.key")
            }
        });
    })
    .mock ("server", "info")
    .mock (process.stderr, "write")
    .mock (process.stdout, "write", { iterations: 1 })
    .after (async (s) =>
    {
        await s.server.start ();
    })
    .after (async (s) =>
    {
        let commandTest = test.command ("myapp.commands.CheckIn");

        await commandTest.testUp ("1234",
        {
            location: { latitude: 33, longitude: 44 },
            xUrl: "https://127.0.0.1",
            xPort: s.server.realPort,
            xHost: "app.pushcorn.com",
            xInsecure: true,
            xSilent: true
        });

        s.apiResult = await commandTest.test ();
    })
    .after (async (s) =>
    {
        let commandTest = test.command ("myapp.commands.CheckIn");

        await commandTest.testUp ("1234",
        {
            location: nit.toJson ({ latitude: 33, longitude: 44 }),
            xUrl: "https://127.0.0.1",
            xHost: "app.pushcorn.com",
            xInsecure: true
        });

        let args;

        test.mock (s.http, "fetch", function ()
        {
            args = nit.array (arguments);

            return {
                statusCode: 400,
                headers: {}
            };
        });

        await commandTest.test ();

        s.apiUrl2 = args[0];
    })
    .deinit (async (s) =>
    {
        await nit.sleep (10);
        await s.server.stop ();
    })
    .returnsInstanceOf ("nit.Command", true)
    .expectingPropertyToBe ("result.name", "myapp.commands.CheckIn")
    .expectingPropertyToBe ("mocks.1.invocations.length", 1)
    .expectingPropertyToBe ("apiUrl2", "https://127.0.0.1/check-ins")
    .commit ()
;
