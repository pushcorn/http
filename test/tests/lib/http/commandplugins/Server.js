nit.require ("nit.Command");


test.plugin ("http.commandplugins.Server", "run")
    .should ("start the HTTP server")
        .mock ("Server.prototype", "start")
        .init (s => s.hostClass = nit.defineCommand ("test.commands.MyServer"))
        .init (s => s.hostClassName = "")
        .init (s => s.pluginArgs =
        {
            name: "nit test server",
            version: "1.0.0"
        })
        .expectingPropertyToBe ("host.server.version", "1.0.0")
        .commit ()

    .should ("use the http package's version if package.json is not found")
        .application ()
        .mock ("Server.prototype", "start")
        .init (s => nit.fs.rmSync (s.app.root.join ("package.json")))
        .init (s => s.hostClass = nit.defineCommand ("test.commands.MyServer"))
        .init (s => s.hostClassName = "")
        .expecting ("the version is set to the http package version", s => s.host.server.version == s.http.VERSION)
        .commit ()

    .should ("use the http package's version if the closest package.json does not have version info")
        .application ()
        .mock ("Server.prototype", "start")
        .init (s => s.hostClass = nit.defineCommand ("test.commands.MyServer"))
        .init (s => s.hostClassName = "")
        .expecting ("the version is set to the http package version", s => s.host.server.version == s.http.VERSION)
        .commit ()
;


test.custom ("Plugin: http.commandplugins.Server")
    .should ("start the HTTP server")
        .project ("myapp", true)
        .application ()
        .mock ("Server.prototype", "start")
        .init (s => nit.fs.rmSync (s.app.root.join ("package.json")))
        .init (s => process.chdir (s.app.root.absPath))
        .up (s => s.command = nit.new ("myapp.commands.Server"))
        .task (s => s.command.run ())
        .expectingPropertyToBe ("command.server.version", "1.2.3")
        .expectingPropertyToBe ("command.server.assetresolvers.length", 0)
        .commit ()

    .should ("try to figure the version from package.json")
        .project ("myapp", true)
        .mock ("Server.prototype", "start")
        .up (s => s.command = nit.new ("myapp.commands.Server"))
        .task (s => s.command.run ())
        .expectingPropertyToBe ("command.server.version", "1.2.3")
        .expectingPropertyToBe ("command.server.assetresolvers.length", 0)
        .commit ()

    .should ("add an asset resolver for the specified root")
        .project ("myapp", true)
        .mock ("Server.prototype", "start")
        .up (s => s.command = nit.new ("myapp.commands.Server"))
        .task (s => s.command.run ({ root: __dirname }))
        .expectingPropertyToBe ("command.server.assetresolvers.length", 1)
        .commit ()
;
