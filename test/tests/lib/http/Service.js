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


test.method ("http.Service", "start")
    .should ("start the service")
        .up (s =>
        {
            const Plugin = s.http.defineServicePlugin ("MyPlugin", true)
                .onPreStart (() => s.preStart = true)
                .onPostStart (() => s.postStart = true)
            ;

            const MyApi = s.http.defineApi ("MyApi")
                .condition ("http:request-path", "/one")
                .onPreStart (() => s.handlerPreStart = true)
                .onPostStart (() => s.handlerPostStart = true)
                .onStart (() => s.handlerStart = true)
            ;

            s.class = s.class.defineSubclass ("MyService")
                .serviceplugin (new Plugin)
                .onStart (() => s.startCalled = true)
            ;

            s.createArgs = { handlers: new MyApi };
        })
        .before (s => s.object.preStart ())
        .before (s => s.object.postStart ())
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("preStart", true)
        .expectingPropertyToBe ("postStart", true)
        .expectingPropertyToBe ("startCalled", true)
        .expectingPropertyToBe ("handlerPreStart", true)
        .expectingPropertyToBe ("handlerPostStart", true)
        .expectingPropertyToBe ("handlerStart", true)
        .commit ()
;


test.method ("http.Service", "stop")
    .should ("stop the service")
        .up (s =>
        {
            const Plugin = s.http.defineServicePlugin ("MyPlugin", true)
                .onPreStop (() => s.preStop = true)
                .onPostStop (() => s.postStop = true)
            ;

            const MyApi = s.http.defineApi ("MyApi")
                .condition ("http:request-path", "/one")
                .onPreStop (() => s.handlerPreStop = true)
                .onPostStop (() => s.handlerPostStop = true)
                .onStop (() => s.handlerStop = true)
            ;

            s.class = s.class.defineSubclass ("MyService")
                .serviceplugin (new Plugin)
                .onStop (() => s.stopCalled = true)
            ;

            s.createArgs = { apis: new MyApi };
        })
        .before (s => s.object.preStop ())
        .before (s => s.object.postStop ())
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("preStop", true)
        .expectingPropertyToBe ("postStop", true)
        .expectingPropertyToBe ("stopCalled", true)
        .expectingPropertyToBe ("handlerPreStop", true)
        .expectingPropertyToBe ("handlerPostStop", true)
        .expectingPropertyToBe ("handlerStop", true)
        .commit ()
;


test.method ("http.Service", "dispatch")
    .should ("skip the dispatch callback if the response is set by a plugin")
        .up (s =>
        {
            const Plugin = s.http.defineServicePlugin ("MyPlugin")
                .onPreDispatch ((service, ctx) =>
                {
                    ctx.send ("http:noop");

                    s.preDispatch = true;
                })
                .onPostDispatch (() => s.postDispatch = true)
            ;

            s.class = s.class.defineSubclass ("MyService");
            s.class.serviceplugin (new Plugin);
            s.class.onDispatch (() => s.dispatchCalled = true);
        })
        .given (Context.new ())
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("preDispatch", true)
        .expectingPropertyToBe ("postDispatch", true)
        .expectingPropertyToBe ("dispatchCalled", undefined)
        .commit ()

    .should ("read the request if the hook was implemented")
        .up (s =>
        {
            s.class = s.class.defineSubclass ("MyService");
            s.class.onDispatch (() => s.dispatchCalled = true);
        })
        .given (Context.new ())
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("dispatchCalled", true)
        .expectingPropertyToBe ("args.0.requestRead", true)
        .commit ()
;


test.object ("http.Service")
    .should ("create the hostname conditions for the specified hostnames")
        .given ({ hostnames: ["*.pushcorn.com", "app.pushcorn.test"] })
        .expectingPropertyToBe ("instance.conditions.length", 1)
        .expectingPropertyToBe ("instance.conditions.0.patterns.length", 2)
        .commit ()
;
