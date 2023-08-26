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


test.method ("http.Handler", "run")
    .should ("run the handler")
        .up (s => s.http.defineHandlerPlugin ("TestPlugin")
            .onPreRun (ctx => ctx.pluginOnPreRunCalled = true)
            .onPostRun (ctx => ctx.pluginOnPostRunCalled = true)
        )
        .up (s => s.class = s.http.defineHandler ("Controller")
            .handlerplugin ("http:test-plugin")
            .onRun (ctx => ctx.onRunCalled = true)
            .onPreRun (ctx => ctx.onPreRunCalled = true)
            .onPostRun (ctx => ctx.onPostRunCalled = true)
        )
        .givenContext ()
        .expectingPropertyToBe ("args.0.onRunCalled", true)
        .expectingPropertyToBe ("args.0.onPreRunCalled", true)
        .expectingPropertyToBe ("args.0.onPostRunCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPreRunCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPostRunCalled", true)
        .commit ()
;


test.method ("http.Handler", "catch")
    .should ("try to process the exception")
        .up (s => s.http.defineHandlerPlugin ("TestPlugin")
            .onPreCatch (ctx => ctx.pluginOnPreCatchCalled = true)
            .onPostCatch (ctx => ctx.pluginOnPostCatchCalled = true)
        )
        .up (s => s.class = s.http.defineHandler ("Controller")
            .handlerplugin ("http:test-plugin")
            .onCatch (ctx => ctx.onCatchCalled = true)
            .onPreCatch (ctx => ctx.onPreCatchCalled = true)
            .onPostCatch (ctx => ctx.onPostCatchCalled = true)
        )
        .givenContext ()
        .expectingPropertyToBe ("args.0.onCatchCalled", true)
        .expectingPropertyToBe ("args.0.onPreCatchCalled", true)
        .expectingPropertyToBe ("args.0.onPostCatchCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPreCatchCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPostCatchCalled", true)
        .commit ()

    .should ("rethrow the processed error")
        .up (s => s.http.defineHandlerPlugin ("TestPlugin")
            .onPreCatch (ctx => ctx.pluginOnPreCatchCalled = true)
            .onPostCatch (ctx => ctx.pluginOnPostCatchCalled = true)
        )
        .up (s => s.class = s.http.defineHandler ("Controller")
            .handlerplugin ("http:test-plugin")
            .onCatch (ctx => ctx.onCatchCalled = true)
            .onPreCatch (ctx => ctx.onPreCatchCalled = true)
            .onPostCatch (ctx => ctx.onPostCatchCalled = true)
        )
        .givenContext ({}, { error: new Error ("UNKNOWN") })
        .throws ("UNKNOWN")
        .expectingPropertyToBe ("args.0.onCatchCalled", true)
        .expectingPropertyToBe ("args.0.onPreCatchCalled", true)
        .expectingPropertyToBe ("args.0.onPostCatchCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPreCatchCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPostCatchCalled", true)
        .commit ()
;


test.method ("http.Handler", "finalize")
    .should ("invoke the finalize callbacks")
        .up (s => s.http.defineHandlerPlugin ("TestPlugin")
            .onPreFinalize (ctx => ctx.pluginOnPreFinalizeCalled = true)
            .onPostFinalize (ctx => ctx.pluginOnPostFinalizeCalled = true)
        )
        .up (s => s.class = s.http.defineHandler ("Controller")
            .handlerplugin ("http:test-plugin")
            .onFinalize (ctx => ctx.onFinalizeCalled = true)
            .onPreFinalize (ctx => ctx.onPreFinalizeCalled = true)
            .onPostFinalize (ctx => ctx.onPostFinalizeCalled = true)
        )
        .givenContext ()
        .expectingPropertyToBe ("args.0.onFinalizeCalled", true)
        .expectingPropertyToBe ("args.0.onPreFinalizeCalled", true)
        .expectingPropertyToBe ("args.0.onPostFinalizeCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPreFinalizeCalled", true)
        .expectingPropertyToBe ("args.0.pluginOnPostFinalizeCalled", true)
        .commit ()
;


test.method ("http.Handler", "dispatch")
    .should ("process the request")
        .up (s => s.class = s.http.defineHandler ("Controller")
            .onRun (ctx => ctx.root.onRunCalled = true)
            .onCatch (ctx => ctx.root.onCatchCalled = true)
            .onFinalize (ctx => ctx.root.onFinalizeCalled = true)
        )
        .givenContext ()
        .expectingPropertyToBe ("args.0.onRunCalled", true)
        .expectingPropertyToBe ("args.0.onCatchCalled", undefined)
        .expectingPropertyToBe ("args.0.onFinalizeCalled", true)
        .commit ()

    .up (s => s.class = s.http.defineHandler ("Controller")
            .onRun (() => { throw new Error ("ERR!"); })
            .onCatch (ctx => { ctx.root.onCatchCalled = true; ctx.error = null; })
            .onFinalize (ctx => ctx.root.onFinalizeCalled = true)
        )
        .givenContext ()
        .expectingPropertyToBe ("args.0.onCatchCalled", true)
        .expectingPropertyToBe ("args.0.onFinalizeCalled", true)
        .commit ()
;
