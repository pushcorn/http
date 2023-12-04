test.object ("http.Host")
    .should ("have a hostname getter")
        .given (
        {
            hostnames: "app.pushcorn.com",
            services: "http:file-server",
            requestFilters: "http:json-body-parser",
            responseFilters: "http:body-compressor",
            certificate:
            {
                cert: "pushcorn.com.crt",
                key: "pushcorn.com.key",
                ca: "ca.pushcorn.com.crt"
            }
        })
        .returnsInstanceOf ("http.Host")
        .expectingPropertyToBe ("result.conditions.length", 1)
        .expectingPropertyToBe ("result.hostnames", ["app.pushcorn.com"])
        .expectingPropertyToBeOfType ("result.certificate", "http.Certificate")
        .expectingPropertyToBeOfType ("result.requestFilters.0", "http.requestfilters.JsonBodyParser")
        .expectingPropertyToBeOfType ("result.responseFilters.0", "http.responsefilters.BodyCompressor")
        .expectingPropertyToBeOfType ("result.services.0", "http.services.FileServer")
        .expectingPropertyToBe ("result.hostname", "app.pushcorn.com")
        .commit ()

    .reset ()
        .given (
        {
            services: "http:file-server",
            requestFilters: "http:json-body-parser",
            responseFilters: "http:body-compressor",
            certificate:
            {
                cert: "pushcorn.com.crt",
                key: "pushcorn.com.key",
                ca: "ca.pushcorn.com.crt"
            }
        })
        .returnsInstanceOf ("http.Host")
        .expectingPropertyToBe ("result.conditions.length", 0)
        .expectingPropertyToBe ("result.hostname", "")
        .commit ()
;


test.method ("http.Host", "init")
    .should ("initialize the services")
    .up (s =>
    {
        s.called = [];

        const Service = s.http.defineService ("TestService")
            .onPreInit (() => s.called.push ("preInitService"))
            .onPostInit (() => s.called.push ("postInitService"))
            .onInit (() => s.called.push ("initService"))
        ;

        s.class = s.class.defineSubclass ("MyHost")
            .onPreInit (() => s.called.push ("preInitHost"))
            .onPostInit (() => s.called.push ("postInitHost"))
            .onInit (() => s.called.push ("initHost"))
        ;

        s.createArgs = { services: new Service () };
    })
    .before (s => s.object.preInit ())
    .after (s => s.object.postInit ())
    .returnsResultOfExpr ("object")
    .expectingPropertyToBe ("called", ["preInitHost", "preInitService", "initHost", "initService", "postInitHost", "postInitService"])
    .commit ()
;


test.method ("http.Host", "start")
    .should ("invoke services' start method")
    .up (s =>
    {
        s.called = [];

        const Service = s.http.defineService ("TestService")
            .onPreStart (() => s.called.push ("preStartService"))
            .onPostStart (() => s.called.push ("postStartService"))
            .onStart (() => s.called.push ("startService"))
        ;

        s.class = s.class.defineSubclass ("MyHost")
            .onPreStart (() => s.called.push ("preStartHost"))
            .onPostStart (() => s.called.push ("postStartHost"))
            .onStart (() => s.called.push ("startHost"))
        ;

        s.createArgs = { services: new Service () };
    })
    .before (s => s.object.preStart ())
    .after (s => s.object.postStart ())
    .returnsResultOfExpr ("object")
    .expectingPropertyToBe ("called", ["preStartHost", "preStartService", "startHost", "startService", "postStartHost", "postStartService"])
    .commit ()
;


test.method ("http.Host", "stop")
    .should ("invoke services' stop method")
    .up (s =>
    {
        s.called = [];

        const Service = s.http.defineService ("TestService")
            .onPreStop (() => s.called.push ("preStopService"))
            .onPostStop (() => s.called.push ("postStopService"))
            .onStop (() => s.called.push ("stopService"))
        ;

        s.class = s.class.defineSubclass ("MyHost")
            .onPreStop (() => s.called.push ("preStopHost"))
            .onPostStop (() => s.called.push ("postStopHost"))
            .onStop (() => s.called.push ("stopHost"))
        ;

        s.createArgs = { services: new Service () };
    })
    .before (s => s.object.preStop ())
    .after (s => s.object.postStop ())
    .returnsResultOfExpr ("object")
    .expectingPropertyToBe ("called", ["preStopService", "preStopHost", "stopService", "stopHost", "postStopService", "postStopHost"])
    .commit ()
;


test.method ("http.Host", "dispatch")
    .should ("invoke services' dispatch method")
    .up (s =>
    {
        s.called = [];

        const Service = s.http.defineService ("TestService")
            .onPreDispatch (() => s.called.push ("preDispatchService"))
            .onPostDispatch (() => s.called.push ("postDispatchService"))
            .onDispatch (() => s.called.push ("dispatchService"))
        ;

        s.class = s.class.defineSubclass ("MyHost")
            .onPreDispatch (() => s.called.push ("preDispatchHost"))
            .onPostDispatch (() => s.called.push ("postDispatchHost"))
            .onDispatch (() => s.called.push ("dispatchHost"))
        ;

        s.createArgs =
        {
            services: new Service ()
        };

        s.args = s.Context.new ();
    })
    .returnsResultOfExpr ("args.0")
    .expectingPropertyToBe ("called", ["preDispatchHost", "dispatchHost", "preDispatchService", "dispatchService", "postDispatchService", "postDispatchHost"])
    .expectingPropertyToBeOfType ("args.0.service", "http.services.TestService")
    .commit ()
;


test.method ("http.Host", "upgrade")
    .should ("invoke target service's upgrade method")
    .up (s =>
    {
        s.called = [];

        const Service = s.http.defineService ("TestService")
            .onPreUpgrade (() => s.called.push ("preUpgradeService"))
            .onPostUpgrade (() => s.called.push ("postUpgradeService"))
            .onUpgrade (() => s.called.push ("upgradeService"))
            .onUpgrade (req => s.upgradeArg = req)
        ;

        s.class = s.class.defineSubclass ("MyHost")
            .onPreUpgrade (() => s.called.push ("preUpgradeHost"))
            .onPostUpgrade (() => s.called.push ("postUpgradeHost"))
            .onUpgrade (() => s.called.push ("upgradeHost"))
        ;

        s.createArgs =
        {
            services: new Service ()
        };

        s.args = [
            new s.IncomingMessage ("GET", "/", { headers: { host: "app.pushcorn.com" } }),
            new s.Socket
        ];
    })
    .returnsResultOfExpr ("object")
    .expectingPropertyToBe ("called", ["preUpgradeHost", "upgradeHost", "preUpgradeService", "upgradeService", "postUpgradeService", "postUpgradeHost"])
    .expectingPropertyToBeOfType ("upgradeArg", "http.mocks.IncomingMessage")
    .commit ()
;
