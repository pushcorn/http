const Colorizer = nit.require ("nit.utils.Colorizer");


test.subcommand ("commands.Api", "myapp:hello")
    .should ("invoke the specified API")
        .project ("myapp", true)
        .mock ("server", "info")
        .mock (process.stderr, "write")
        .mock (process.stdout, "write")
        .given ("John Doe", "Mr.")
        .init (async (s) =>
        {
            s.stderrs = [];
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
                    destroy: nit.noop,
                    binary: nit.noop,
                    destroyed: true,
                    statusCode: 400,
                    headers: {}
                };
            });

            s.commandArgs.push ("--silent");
            await s.testUp (...s.args, "--opt1", "val3");

            s.helloResult3 = await s.test ();
            s.exitCode3 = process.exitCode;

            process.exitCode = 0;
        })
        .after (async (s) =>
        {
            test.mock (s.http, "fetch", function ()
            {
                return nit.assign (s.bufferToStream ("ALL OK"),
                {
                    destroy: nit.noop,
                    isText: true,
                    statusCode: 200,
                    text: function () { return nit.readStream (this); },
                    headers:
                    {
                        "content-length": 6,
                        "content-type": "text/plain"
                    }
                });
            });

            await s.testUp (...s.args);

            s.helloResult4 = await s.test ();
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
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .expectingPropertyToBe ("helloResult3", undefined)
        .expectingPropertyToBe ("helloResult4", Colorizer.gray ("ALL OK"))
        .expectingPropertyToBe ("exitCode3", 1)
        .commit ()
;



test.method ("commands.Api.ApiSubcommand", "buildSubcommand", true)
    .should ("build the subcommand for the given API")
        .project ("myapp", true)
        .before (s => s.args = ["myapp.apisubcommands.Hello", new nit.ComponentDescriptor ("myapp.apis.Hello", "apis")])
        .expectingPropertyToBe ("result.Input.fields.length", 8)
        .expectingPropertyToBe ("result.Input.fieldMap.opt1.constraints.length", 0)
        .commit ()

    .should ("not remove the parameter constraints in completion mode")
        .project ("myapp", true)
        .up (() => nit.dpv (nit, "COMPLETION_MODE", true, true))
        .before (s => s.args = ["myapp.apisubcommands.Hello", new nit.ComponentDescriptor ("myapp.apis.Hello", "apis")])
        .expectingPropertyToBe ("result.Input.fieldMap.opt1.constraints.length", 1)
        .commit ()
;
