test.method ("http.Handler.Descriptor", "build")
    .should ("return a handler")
        .up (s => s.http.defineHandlerPlugin ("TestPlugin"))
        .up (s => s.createArgs =
        {
            endpoint: "GET /users",
            conditions:
            {
                name: "http:hostname",
                options: "app.pushcorn.com"
            },
            plugins: "http:test-plugin",
            requestFilters: "http:json-body-parser",
            responseFilters: "http:body-compressor"
        })
        .returnsInstanceOf ("http.Handler")
        .expectingPropertyToBeOfType ("result.constructor.conditions.0", "http.conditions.RequestMethod")
        .expectingPropertyToBeOfType ("result.constructor.conditions.1", "http.conditions.RequestPath")
        .expectingPropertyToBeOfType ("result.constructor.conditions.2", "http.conditions.Hostname")
        .expectingPropertyToBe ("result.constructor.handlerplugins.length", 1)
        .expectingPropertyToBe ("result.requestFilters.length", 1)
        .expectingPropertyToBe ("result.responseFilters.length", 1)
        .commit ()

    .reset ()
        .up (s => s.createArgs =
        {
            conditions:
            {
                name: "http:hostname",
                options: "app.pushcorn.com"
            },
            requestFilters: "http:json-body-parser",
            responseFilters: "http:body-compressor"
        })
        .returnsInstanceOf ("http.Handler")
        .expectingPropertyToBeOfType ("result.constructor.conditions.0", "http.conditions.Hostname")
        .expectingPropertyToBe ("result.requestFilters.length", 1)
        .expectingPropertyToBe ("result.responseFilters.length", 1)
        .commit ()
;


test.method ("http.Handler", "preInit")
    .should ("initialize the service property")
        .up (s => s.args = s.Service.Descriptor.build ())
        .expectingPropertyToBeOfType ("object.service", "http.Service")
        .commit ()
;


test.method ("http.Handler", "postInit")
    .should ("invoke the postInit hook")
        .up (s => s.args = s.Service.Descriptor.build ())
        .mock ("class", "http.Handler.postInit")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBeOfType ("mocks.0.invocations.0.args.0", "http.Service")
        .commit ()
;


test.method ("http.Handler", "init")
    .should ("invoke the init hook")
        .up (s => s.args = s.Service.Descriptor.build ())
        .mock ("class", "http.Handler.init")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBeOfType ("mocks.0.invocations.0.args.0", "http.Service")
        .commit ()
;


test.method ("http.Handler", "catch")
    .should ("try to process the exception")
        .up (s => s.http.defineHandlerPlugin ("TestPlugin")
            .onPreCatch ((handler, ctx) => ctx.pluginOnPreCatchCalled = true)
            .onPostCatch ((handler, ctx) => ctx.pluginOnPostCatchCalled = true)
        )
        .up (s => s.class = s.http.defineHandler ("Controller")
            .handlerplugin ("http:test-plugin")
            .onCatch (ctx => ctx.onCatchCalled = true)
            .onPreCatch (ctx => ctx.onPreCatchCalled = true)
            .onPostCatch (ctx => ctx.onPostCatchCalled = true)
        )
        .givenContext ()
        .after (s => s.object.preCatch (s.args[0]))
        .after (s => s.object.postCatch (s.args[0]))
        .expectingPropertyToBe ("args.0.onCatchCalled", true)
        .expectingPropertyToBe ("args.0.onPreCatchCalled", true)
        .expectingPropertyToBe ("args.0.onPostCatchCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPreCatchCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPostCatchCalled", true)
        .commit ()

    .should ("rethrow the processed error")
        .up (s => s.class = s.http.defineHandler ("Controller"))
        .givenContext ({}, { error: new Error ("UNKNOWN") })
        .throws ("UNKNOWN")
        .commit ()

    .should ("not throw error if it has been processed")
        .givenContext ()
        .returns ()
        .commit ()
;


test.method ("http.Handler", "run")
    .should ("run the handler")
        .up (s => s.http.defineHandlerPlugin ("TestPlugin")
            .onPreRun ((handler, ctx) => ctx.pluginOnPreRunCalled = true)
            .onPostRun ((handler, ctx) => ctx.pluginOnPostRunCalled = true)
        )
        .up (s => s.class = s.http.defineHandler ("Controller")
            .handlerplugin ("http:test-plugin")
            .onRun (ctx => ctx.onRunCalled = true)
            .onPreRun (ctx => ctx.onPreRunCalled = true)
            .onPostRun (ctx => ctx.onPostRunCalled = true)
        )
        .givenContext ()
        .expectingPropertyToBe ("result.onRunCalled", true)
        .expectingPropertyToBe ("result.onPreRunCalled", true)
        .expectingPropertyToBe ("result.onPostRunCalled", true)
        .expectingPropertyToBe ("result.pluginOnPreRunCalled", true)
        .expectingPropertyToBe ("result.pluginOnPostRunCalled", true)
        .expectingPropertyToBeOfType ("result.parent", "http.Context")
        .commit ()

    .should ("process the request")
        .up (s => s.class = s.http.defineHandler ("Controller")
            .onRun (ctx => ctx.root.onRunCalled = true)
            .onCatch (ctx => ctx.root.onCatchCalled = true)
            .onFinally (ctx => ctx.root.onFinallyCalled = true)
        )
        .givenContext ()
        .expectingPropertyToBe ("args.0.onRunCalled", true)
        .expectingPropertyToBe ("args.0.onCatchCalled", undefined)
        .expectingPropertyToBe ("args.0.onFinallyCalled", true)
        .commit ()

    .should ("use the provided context if it's an instance of Handler.Context")
        .up (s => s.class = s.http.defineHandler ("Controller")
            .onRun (ctx => ctx.onRunCalled = true)
            .onCatch (ctx => ctx.onCatchCalled = true)
            .onFinally (ctx => ctx.onFinallyCalled = true)
        )
        .up (s => s.args = s.class.Context.new (s.Context.new ()))
        .expectingPropertyToBe ("args.0.onRunCalled", true)
        .expectingPropertyToBe ("args.0.onCatchCalled", undefined)
        .expectingPropertyToBe ("args.0.onFinallyCalled", true)
        .commit ()

    .should ("call finally when run throws")
        .up (s => s.class = s.http.defineHandler ("Controller")
            .onRun (() => { throw new Error ("ERR!"); })
            .onCatch (ctx => { ctx.root.onCatchCalled = true; ctx.error = null; })
            .onFinally (ctx => ctx.root.onFinallyCalled = true)
        )
        .givenContext ()
        .expectingPropertyToBe ("args.0.onCatchCalled", true)
        .expectingPropertyToBe ("args.0.onFinallyCalled", true)
        .commit ()

    .should ("update the error the the one throw during the catch phase")
        .up (s => s.class = s.http.defineHandler ("Controller")
            .onRun (() => { throw new Error ("ERR!"); })
            .onCatch (ctx => { throw new Error ("CATCH: " + ctx.error.message); })
        )
        .givenContext ()
        .throws ("CATCH: ERR!")
        .commit ()

    .should ("update the error the the one throw during the finally phase")
        .up (s => s.class = s.http.defineHandler ("Controller")
            .onRun (() => { throw new Error ("ERR!"); })
            .onCatch (ctx => { throw new Error ("CATCH: " + ctx.error.message); })
            .onFinally (ctx => { throw new Error ("FINALLY: " + ctx.error.message); })
        )
        .givenContext ()
        .throws ("FINALLY: CATCH: ERR!")
        .commit ()
;


test.method ("http.Handler", "endpoint", true)
    .should ("update the request method and path conditions")
        .up (s => s.class = s.class.defineSubclass ("test.handlers.Handler1"))
        .expectingPropertyToBe ("class.requestMethod", "GET")
        .expectingPropertyToBe ("class.requestPath", "/test/handler1")
        .commit ()

    .should ("pluralize the last path component when needed")
        .up (s => s.class = s.class.defineSubclass ("test.handlers.CreateJob"))
        .expectingPropertyToBe ("class.requestMethod", "POST")
        .expectingPropertyToBe ("class.requestPath", "/test/jobs")
        .commit ()
;


test.object ("http.Handler", false)
    .should ("add endpoint automatically when onRun () is defined if it was not called")
        .project ("myapp")
        .up (s => s.class = nit.lookupClass ("myapp.apis.AutoPath"))
        .expectingPropertyToBe ("class.requestMethod", "GET")
        .expectingPropertyToBe ("class.requestPath", "/myapp/auto-path")
        .commit ()
;
