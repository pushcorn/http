const Context = nit.require ("http.Context");


test.method ("http.Service", "dispatch")
    .should ("find a suitable API to run")
        .given (Context.new ("GET", "/two"))
        .up (s =>
        {
            const Api1 = s.http.defineApi ("Api1", true)
                .condition ("http:request-path", "/one")
                .onRun (() =>
                {
                    s.handledBy = "Api1";
                })
            ;

            const Api2 = s.http.defineApi ("Api2", true)
                .condition ("http:request-path", "/two")
                .onRun (() =>
                {
                    s.handledBy = "Api2";
                })
            ;

            s.createArgs = { apis: [new Api1, new Api2] };
        })
        .expectingPropertyToBe ("handledBy", "Api2")
        .commit ()
;


test.method ("http.Service", "init")
    .should ("initialize the service")
        .up (s =>
        {
            s.called = [];

            const MyPlugin = s.http.defineServicePlugin ("MyPlugin")
                .onPreInit (() => s.called.push ("preInitPlugin"))
                .onPostInit (() => s.called.push ("postInitPlugin"))
                .onInit (() => s.called.push ("initPlugin"))
            ;

            const MyHandler = s.http.defineHandler ("MyHandler")
                .onPreInit (() => s.called.push ("preInitHandler"))
                .onPostInit (() => s.called.push ("postInitHandler"))
                .onInit (() => s.called.push ("initHandler"))
            ;

            s.class = s.class.defineSubclass ("MyService")
                .onPreInit (() => s.called.push ("preInitService"))
                .onPostInit (() => s.called.push ("postInitService"))
                .onInit (() => s.called.push ("initService"))
            ;

            s.class.serviceplugin (new MyPlugin);
            s.createArgs = { handlers: new MyHandler };
        })
        .before (s => s.object.preInit ())
        .after (s => s.object.postInit ())
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("called",
        [
            "preInitService",
            "preInitPlugin",
            "preInitHandler",
            "initService",
            "initPlugin",
            "initHandler",
            "postInitService",
            "postInitPlugin",
            "postInitHandler"
        ])
        .commit ()
;


test.method ("http.Service", "start")
    .should ("start the service")
        .up (s =>
        {
            s.called = [];

            const MyPlugin = s.http.defineServicePlugin ("MyPlugin")
                .onPreStart (() => s.called.push ("preStartPlugin"))
                .onPostStart (() => s.called.push ("postStartPlugin"))
                .onStart (() => s.called.push ("startPlugin"))
            ;

            const MyHandler = s.http.defineHandler ("MyHandler")
                .onPreStart (() => s.called.push ("preStartHandler"))
                .onPostStart (() => s.called.push ("postStartHandler"))
                .onStart (() => s.called.push ("startHandler"))
            ;

            s.class = s.class.defineSubclass ("MyService")
                .onPreStart (() => s.called.push ("preStartService"))
                .onPostStart (() => s.called.push ("postStartService"))
                .onStart (() => s.called.push ("startService"))
            ;

            s.class.serviceplugin (new MyPlugin);
            s.createArgs = { handlers: new MyHandler };
        })
        .before (s => s.object.preStart ())
        .after (s => s.object.postStart ())
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("called",
        [
            "preStartService",
            "preStartPlugin",
            "preStartHandler",
            "startService",
            "startPlugin",
            "startHandler",
            "postStartService",
            "postStartPlugin",
            "postStartHandler"
        ])
        .commit ()
;


test.method ("http.Service", "stop")
    .should ("stop the service")
        .up (s =>
        {
            s.called = [];

            const MyPlugin = s.http.defineServicePlugin ("MyPlugin")
                .onPreStop (() => s.called.push ("preStopPlugin"))
                .onPostStop (() => s.called.push ("postStopPlugin"))
                .onStop (() => s.called.push ("stopPlugin"))
            ;

            const MyHandler = s.http.defineHandler ("MyHandler")
                .onPreStop (() => s.called.push ("preStopHandler"))
                .onPostStop (() => s.called.push ("postStopHandler"))
                .onStop (() => s.called.push ("stopHandler"))
            ;

            s.class = s.class.defineSubclass ("MyService")
                .onPreStop (() => s.called.push ("preStopService"))
                .onPostStop (() => s.called.push ("postStopService"))
                .onStop (() => s.called.push ("stopService"))
            ;

            s.class.serviceplugin (new MyPlugin);
            s.createArgs = { handlers: new MyHandler };
        })
        .before (s => s.object.preStop ())
        .after (s => s.object.postStop ())
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("called",
        [
            "preStopHandler",
            "preStopService",
            "preStopPlugin",
            "stopHandler",
            "stopService",
            "stopPlugin",
            "postStopHandler",
            "postStopService",
            "postStopPlugin"
        ])
        .commit ()
;


test.method ("http.Service", "dispatch")
    .should ("skip the dispatch callback if the response is set by a plugin")
        .up (s =>
        {
            s.called = [];

            const MyPlugin = s.http.defineServicePlugin ("MyPlugin")
                .onPreDispatch ((service, ctx) =>
                {
                    ctx.noop ();

                    s.called.push ("preDispatchPlugin");
                })
                .onPostDispatch (() => s.called.push ("postDispatchPlugin"))
                .onDispatch (() => s.called.push ("dispatchPlugin"))
            ;

            const MyHandler = s.http.defineHandler ("MyHandler")
                .onPreRun (() => s.called.push ("preRunHandler"))
                .onPostRun (() => s.called.push ("postRunHandler"))
                .onRun (() => s.called.push ("runHandler"))
            ;

            s.class = s.class.defineSubclass ("MyService")
                .onPreDispatch (() => s.called.push ("preDispatchService"))
                .onPostDispatch (() => s.called.push ("postDispatchService"))
                .onDispatch (() => s.called.push ("dispatchService"))
            ;

            s.class.serviceplugin (new MyPlugin);
            s.createArgs = { handlers: new MyHandler };
        })
        .given (Context.new ())
        .returnsResultOfExpr ("args.0")
        .expectingPropertyToBe ("called", ["preDispatchService", "preDispatchPlugin", "postDispatchService", "postDispatchPlugin"])
        .commit ()

    .should ("run the handler if the response was not set by the plugin")
        .up (s =>
        {
            s.called = [];

            const MyPlugin = s.http.defineServicePlugin ("MyPlugin")
                .onPreDispatch (() => s.called.push ("preDispatchPlugin"))
                .onPostDispatch (() => s.called.push ("postDispatchPlugin"))
                .onDispatch (() => s.called.push ("dispatchPlugin"))
            ;

            const MyHandler = s.http.defineHandler ("MyHandler")
                .onPreRun (() => s.called.push ("preRunHandler"))
                .onPostRun (() => s.called.push ("postRunHandler"))
                .onRun (ctx =>
                {
                    ctx.noop ();

                    s.called.push ("runHandler");
                })
            ;

            s.class = s.class.defineSubclass ("MyService")
                .onPreDispatch (() => s.called.push ("preDispatchService"))
                .onPostDispatch (() => s.called.push ("postDispatchService"))
                .onDispatch (() => s.called.push ("dispatchService"))
            ;

            s.class.serviceplugin (new MyPlugin);
            s.createArgs = { handlers: new MyHandler };
        })
        .given (Context.new ())
        .returnsResultOfExpr ("args.0")
        .expectingPropertyToBe ("called",
        [
            "preDispatchService",
            "preDispatchPlugin",
            "dispatchService",
            "preRunHandler",
            "runHandler",
            "postDispatchService",
            "postDispatchPlugin"
        ])
        .commit ()

    .should ("read the request if the hook was implemented")
        .up (s =>
        {
            s.class = s.class.defineSubclass ("MyService");
            s.class.onDispatch (() => s.dispatchCalled = true);
        })
        .given (Context.new ())
        .returnsResultOfExpr ("args.0")
        .expectingPropertyToBe ("dispatchCalled", true)
        .expectingPropertyToBe ("args.0.requestRead", true)
        .commit ()
;


test.method ("http.Service", "upgrade")
    .should ("upgrade the connection")
        .up (s =>
        {
            s.called = [];

            const MyPlugin = s.http.defineServicePlugin ("MyPlugin")
                .onPreUpgrade (() => s.called.push ("preUpgradePlugin"))
                .onPostUpgrade (() => s.called.push ("postUpgradePlugin"))
                .onUpgrade (() => s.called.push ("upgradePlugin"))
            ;

            const MyHandler = s.http.defineHandler ("MyHandler")
                .onPreRun (() => s.called.push ("preRunHandler"))
                .onPostRun (() => s.called.push ("postRunHandler"))
                .onRun (() => s.called.push ("runHandler"))
            ;

            s.class = s.class.defineSubclass ("MyService")
                .onPreUpgrade (() => s.called.push ("preUpgradeService"))
                .onPostUpgrade (() => s.called.push ("postUpgradeService"))
                .onUpgrade (() => s.called.push ("upgradeService"))
            ;

            s.class.serviceplugin (new MyPlugin);
            s.createArgs = { handlers: new MyHandler };
            s.args =
            [
                new s.IncomingMessage ("GET", "/", { headers: { host: "app.pushcorn.com" } }),
                new s.Socket
            ];
        })
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("called",
        [
            "preUpgradeService",
            "preUpgradePlugin",
            "upgradeService",
            "upgradePlugin",
            "postUpgradeService",
            "postUpgradePlugin"
        ])
        .commit ()
;


test.object ("http.Service")
    .should ("create the hostname conditions for the specified hostnames")
        .given ({ hostnames: ["*.pushcorn.com", "app.pushcorn.test"] })
        .expectingPropertyToBe ("instance.conditions.length", 1)
        .expectingPropertyToBe ("instance.conditions.0.patterns.length", 2)
        .commit ()
;
