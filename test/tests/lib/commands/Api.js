const Colorizer = nit.require ("nit.utils.Colorizer");
const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");
const IMG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACJSURBVEhL7ZC9CYBADEbP2iEEp7JxAPdwBZex02EcQ/0iBCzC/ZlTkDx4RYrLC+cMwzB+QQ1bRRtYwSAbPJQdoRe6bIbS41x32MEg9NULlJakStEBRqMRT44yFF+htDRkdpTJiT+OMilxtSgTE1ePMr54sSgjxYtHmXv8tShD8Qn212QYxnc4dwKskJKEHrOFUQAAAABJRU5ErkJggg==";
const IMG = Buffer.from (IMG_BASE64, "base64");


test.subcommand ("commands.Api", "myapp:hello")
    .should ("invoke the specified API")
    .project ("myapp", true)
    .mock ("server", "info")
    .mock (process.stderr, "write")
    .mock (process.stdout, "write", { iterations: 1 })
    .given ("John Doe", "Mr.")
    .init (async (s) =>
    {
        s.server = s.createServer (
        {
            services: "http:api-server"
        });
    })
    .up (async (s) =>
    {
        await s.server.start ();

        s.commandArgs = ["--port", s.server.realPort];
    })
    .after (async (s) =>
    {
        process.stdout.isTTY = false;

        await s.testUp (...s.args);

        s.helloResult2 = await s.test ();

        process.stdout.isTTY = true;
    })
    .after (async (s) =>
    {
        test.mock (s.http, "fetch", function ()
        {
            return {
                statusCode: 400,
                headers: {}
            };
        });

        await s.testUp (...s.args, "--opt1", "val3");

        s.helloResult3 = await s.test ();
        s.exitCode3 = process.exitCode;

        process.exitCode = 0;
    })
    .deinit (async (s) =>
    {
        await nit.sleep (10);
        await s.server.stop ();
    })
    .returns (Colorizer.gray (nit.toJson ({ message: "Hello Mr. John Doe!" }, "  ")))
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /200/)
    .expectingPropertyToBe ("mocks.2.invocations.0.args.0", /200/)
    .expectingPropertyToBe ("helloResult2", nit.toJson ({ message: "Hello Mr. John Doe!" }, "  "))
    .expectingPropertyToBe ("mocks.1.invocations.1.args.0", /400/)
    .expectingPropertyToBe ("helloResult3", undefined)
    .expectingPropertyToBe ("exitCode3", 1)
    .commit ()
;


test.subcommand ("commands.Api", "myapp:get-blob")
    .should ("handle the binary response")
    .project ("myapp", true)
    .mock ("server", "info")
    .mock (process.stderr, "write")
    .mock (process.stdout, "write", { iterations: 1 })
    .given (IMG_BASE64)
    .init (async (s) =>
    {
        s.server = s.createServer (
        {
            services: "http:api-server"
        });
    })
    .up (async (s) =>
    {
        await s.server.start ();

        s.commandArgs = ["--port", s.server.realPort];
    })
    .deinit (async (s) =>
    {
        await nit.sleep (10);
        await s.server.stop ();
    })
    .returns (IMG.toString ("binary"))
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /200/)
    .commit ()
;


test.subcommand ("commands.Api", "myapp:check-in")
    .should ("handle the object input")
    .project ("myapp", true)
    .mock ("server", "info")
    .mock (process.stderr, "write")
    .mock (process.stdout, "write", { iterations: 1 })
    .given (1234, "--location", nit.toJson ({ latitude: 33, longitude: 44 }))
    .init (async (s) =>
    {
        s.server = s.createServer (
        {
            services: "http:api-server"
        });
    })
    .up (async (s) =>
    {
        await s.server.start ();

        s.commandArgs = ["--port", s.server.realPort];
    })
    .deinit (async (s) =>
    {
        await nit.sleep (10);
        await s.server.stop ();
    })
    .returns ("")
    .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /201/)
    .commit ()
;


test.subcommand ("commands.Api", "myapp:check-in")
    .should ("handle the SSL connection")
    .project ("myapp", true)
    .mock ("server", "info")
    .mock (process.stderr, "write")
    .mock (process.stdout, "write", { iterations: 1 })
    .given (1234, "--location", nit.toJson ({ latitude: 33, longitude: 44 }))
    .init (async (s) =>
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
    .up (async (s) =>
    {
        await s.server.start ();

        s.commandArgs =
        [
            "--port", s.server.realPort,
            "-u", "https://127.0.0.1",
            "-h", "app.pushcorn.com",
            "--insecure",
            "--silent"
        ];
    })
    .after (async (s) =>
    {
        let args;

        test.mock (s.http, "fetch", function ()
        {
            args = nit.array (arguments);

            return nit.assign (s.bufferToStream ("NOT_OK"),
            {
                statusCode: 400,
                headers:
                {
                    "content-length": 6,
                    "content-type": "text/plain"
                }
            });
        });

        s.commandArgs =
        [
            "--port", s.server.realPort,
            "-u", "https://127.0.0.1",
            "-h", "app.pushcorn.com",
            "--insecure"
        ];

        await s.testUp (...s.args);

        s.result2 = await s.test ();
        s.apiUrl2 = args[0].replace (/:\d+/, "");
    })
    .deinit (async (s) =>
    {
        await nit.sleep (10);
        await s.server.stop ();
    })
    .returns ("")
    .expectingPropertyToBe ("result2", Colorizer.gray ("NOT_OK"))
    .expectingPropertyToBe ("apiUrl2", "https://127.0.0.1/check-ins")
    .commit ()
;
