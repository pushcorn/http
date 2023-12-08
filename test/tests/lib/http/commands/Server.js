test.command ("http.commands.Server")
    .should ("create and start an instance of http.Server")
        .given ({ port: 0, stopTimeout: 0 })
        .after (async (s) =>
        {
            let server = s.object.server;

            s.port = server.realPort;

            await server.stop ();
        })
        .mock ("http.Server.Logger.prototype", "writeLog")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO].*nit http server/)
        .expectingPropertyToBe ("port", /\d+/)
        .commit ()

    .should ("accept custom root")
        .given (
        {
            port: 0,
            stopTimeout: 0,
            root: ".",
            dev: false
        })
        .after (async (s) =>
        {
            await s.object.server.stop ();
        })
        .mock ("http.Server.Logger.prototype", "writeLog")
        .expectingPropertyToBe ("object.server.assetresolvers.0.assetResolver.roots", [nit.path.join (test.TEST_PROJECT_PATH, "..")])
        .commit ()

    .should ("use the config specifed by the config key")
        .up (() => nit.config ("my-server", { services: "http:file-server" }))
        .given (
        {
            port: 0,
            stopTimeout: 0,
            config: "my-server"
        })
        .after (async (s) =>
        {
            await s.object.server.stop ();
        })
        .mock ("http.Server.Logger.prototype", "writeLog")
        .expectingPropertyToBe ("object.server.hosts.length", 1)
        .expectingPropertyToBe ("object.server.hosts.0.services.length", 1)
        .commit ()

    .should ("use specifed config file")
        .project ("myapp")
        .given (
        {
            port: 0,
            stopTimeout: 0,
            config: "resources/test-server.json"
        })
        .after (async (s) =>
        {
            await s.object.server.stop ();
        })
        .mock ("http.Server.Logger.prototype", "writeLog")
        .expectingPropertyToBe ("object.server.hosts.length", 1)
        .expectingPropertyToBe ("object.server.hosts.0.services.length", 1)
        .commit ()

    .should ("use specifed config object")
        .given (
        {
            port: 0,
            stopTimeout: 0,
            config:
            {
                services: "http:file-server"
            }
        })
        .after (async (s) =>
        {
            await s.object.server.stop ();
        })
        .mock ("http.Server.Logger.prototype", "writeLog")
        .expectingPropertyToBe ("object.server.hosts.length", 1)
        .expectingPropertyToBe ("object.server.hosts.0.services.length", 1)
        .commit ()
;
