test.object ("http.Host")
    .should ("have a hostname getter")
        .given (
        {
            hostnames: "app.pushcorn.com",
            services: "http:file-server",
            requestfilters: "http:json-body-parser",
            responsefilters: "http:body-compressor",
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
        .expectingPropertyToBeOfType ("result.requestfilters.0", "http.requestfilters.JsonBodyParser")
        .expectingPropertyToBeOfType ("result.responsefilters.0", "http.responsefilters.BodyCompressor")
        .expectingPropertyToBeOfType ("result.services.0", "http.services.FileServer")
        .expectingPropertyToBe ("result.hostname", "app.pushcorn.com")
        .commit ()

    .reset ()
        .given (
        {
            services: "http:file-server",
            requestfilters: "http:json-body-parser",
            responsefilters: "http:body-compressor",
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

            const MyPlugin = s.http.defineHostPlugin ("MyPlugin")
                .onPreInit (() => s.called.push ("preInitPlugin"))
                .onPostInit (() => s.called.push ("postInitPlugin"))
                .onInit (() => s.called.push ("initPlugin"))
            ;

            s.class = s.class.defineSubclass ("MyHost")
                .onPreInit (() => s.called.push ("preInitHost"))
                .onPostInit (() => s.called.push ("postInitHost"))
                .onInit (() => s.called.push ("initHost"))
            ;

            s.class.hostplugin (new MyPlugin);
            s.createArgs = { services: new Service () };
        })
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("called",
        [
            "preInitHost",
            "preInitPlugin",

            "initHost",
            "initPlugin",
            "preInitService",
            "initService",
            "postInitService",
            "postInitHost",
            "postInitPlugin"
        ])
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

            const MyPlugin = s.http.defineHostPlugin ("MyPlugin")
                .onPreStart (() => s.called.push ("preStartPlugin"))
                .onPostStart (() => s.called.push ("postStartPlugin"))
                .onStart (() => s.called.push ("startPlugin"))
            ;

            s.class = s.class.defineSubclass ("MyHost")
                .onPreStart (() => s.called.push ("preStartHost"))
                .onPostStart (() => s.called.push ("postStartHost"))
                .onStart (() => s.called.push ("startHost"))
            ;

            s.class.hostplugin (new MyPlugin);
            s.createArgs = { services: new Service () };
        })
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("called",
        [
            "preStartHost",
            "preStartPlugin",
            "startHost",
            "startPlugin",
            "preStartService",
            "startService",
            "postStartService",
            "postStartHost",
            "postStartPlugin"
        ])
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

            const MyPlugin = s.http.defineHostPlugin ("MyPlugin")
                .onPreStop (() => s.called.push ("preStopPlugin"))
                .onPostStop (() => s.called.push ("postStopPlugin"))
                .onStop (() => s.called.push ("stopPlugin"))
            ;

            s.class = s.class.defineSubclass ("MyHost")
                .onPreStop (() => s.called.push ("preStopHost"))
                .onPostStop (() => s.called.push ("postStopHost"))
                .onStop (() => s.called.push ("stopHost"))
            ;

            s.class.hostplugin (new MyPlugin);
            s.createArgs = { services: new Service () };
        })
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("called",
        [
            "preStopHost",
            "preStopPlugin",
            "preStopService",
            "stopService",
            "postStopService",
            "stopHost",
            "stopPlugin",
            "postStopHost",
            "postStopPlugin"
        ])
        .commit ()
;


test.method ("http.Host", "dispatch")
    .should ("invoke the target service's dispatch method")
        .up (s =>
        {
            s.called = [];

            const Service = s.http.defineService ("TestService")
                .onPreDispatch (() => s.called.push ("preDispatchService"))
                .onPostDispatch (() => s.called.push ("postDispatchService"))
                .onDispatch (() => s.called.push ("dispatchService"))
            ;

            const MyPlugin = s.http.defineHostPlugin ("MyPlugin")
                .onPreDispatch (() => s.called.push ("preDispatchPlugin"))
                .onPostDispatch (() => s.called.push ("postDispatchPlugin"))
                .onDispatch (() => s.called.push ("dispatchPlugin"))
            ;

            s.class = s.class.defineSubclass ("MyHost")
                .onPreDispatch (() => s.called.push ("preDispatchHost"))
                .onPostDispatch (() => s.called.push ("postDispatchHost"))
                .onDispatch (() => s.called.push ("dispatchHost"))
            ;

            s.class.hostplugin (new MyPlugin);
            s.createArgs = { services: new Service () };
            s.args = s.Context.new ();
        })
        .returnsResultOfExpr ("args.0")
        .expectingPropertyToBeOfType ("args.0.service", "http.services.TestService")
        .expectingPropertyToBe ("called",
        [
            "preDispatchHost",
            "preDispatchPlugin",
            "dispatchHost",
            "dispatchPlugin",
            "preDispatchService",
            "dispatchService",
            "postDispatchService",
            "postDispatchHost",
            "postDispatchPlugin"
        ])
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

            const MyPlugin = s.http.defineHostPlugin ("MyPlugin")
                .onPreUpgrade (() => s.called.push ("preUpgradePlugin"))
                .onPostUpgrade (() => s.called.push ("postUpgradePlugin"))
                .onUpgrade (() => s.called.push ("upgradePlugin"))
            ;

            s.class = s.class.defineSubclass ("MyHost")
                .onPreUpgrade (() => s.called.push ("preUpgradeHost"))
                .onPostUpgrade (() => s.called.push ("postUpgradeHost"))
                .onUpgrade (() => s.called.push ("upgradeHost"))
            ;

            s.class.hostplugin (new MyPlugin);
            s.createArgs = { services: new Service () };
            s.args =
            [
                new s.IncomingMessage ("GET", "/", { headers: { host: "app.pushcorn.com" } }),
                new s.Socket
            ];
        })
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("called",
        [
            "preUpgradeHost",
            "preUpgradePlugin",
            "upgradeHost",
            "upgradePlugin",
            "preUpgradeService",
            "upgradeService",
            "postUpgradeService",
            "postUpgradeHost",
            "postUpgradePlugin"
        ])
        .expectingPropertyToBeOfType ("upgradeArg", "http.mocks.IncomingMessage")
        .commit ()
;


test.method ("http.Host", "lookupService")
    .should ("lookup the owned service by name")
        .up (s =>
        {
            const Service1 = s.http.defineService ("TestService1");
            const Service2 = s.http.defineService ("TestService2");

            s.createArgs = { services: [new Service1, new Service2] };
        })
        .given ("http:test-service2")
        .returnsInstanceOf ("http.services.TestService2")
        .commit ()
;
