const http = nit.require ("http");
const Context = nit.require ("http.Context");

function defineMiddleware ()
{
    return http.defineMiddleware ("http.Middleware", true);
}


test.method (defineMiddleware (), "run")
    .should ("run the middlewares and plugins")
        .init (function ()
        {
            const Plugin = http.Middleware.defineMiddlewarePlugin ("TestPlugin");

            this.plugin = new Plugin;
            this.class.middlewareplugin (this.plugin);
        })
        .given (Context.create ("GET", "/"))
        .mock ("plugin", "preRun")
        .mock ("plugin", "postRun")
        .expectingPropertyToBeOfType ("plugin", "http.middlewareplugins.TestPlugin")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()

    .should ("throw if the returned response was not in the list of allowed responses")
        .given (Context.create ("GET", "/"))
        .before (function ()
        {
            this.class.response ("http:file-returned");
            this.class.run (ctx => ctx.noop ());
        })
        .mock ("plugin", "preCatch")
        .mock ("plugin", "postCatch")
        .throws ("error.response_not_allowed")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()

    .should ("throw if the context cannot be constructed")
        .given (Context.create ("GET", "/"))
        .before (function ()
        {
            this.class.Context.construct (() => { throw 455; }); // eslint-disable-line no-throw-literal
        })
        .mock ("plugin", "preFinally")
        .mock ("plugin", "postFinally")
        .throws (455)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", undefined)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()
;


test.method (defineMiddleware (), "catch")
    .should ("throw the error if no catch handler defined")
        .given (Context.create ())
        .before (function (ctx)
        {
            ctx.error = new Error ("UNKNOWN");
        })
        .throws ("UNKNOWN")
        .commit ()

    .should ("call catch handler if defined")
        .given (Context.create ())
        .before (function (ctx)
        {
            this.class.catch (ctx =>
            {
                this.err = ctx.error;
            });

            ctx.error = new Error ("UNKNOWN");
        })
        .returns ()
        .expectingPropertyToBe ("err.message", "UNKNOWN")
        .commit ()
;


test.method (defineMiddleware (), "finally")
    .should ("call finally handler if defined")
        .given (Context.create ())
        .before (function ()
        {
            this.class.finally (() =>
            {
                this.finalized = true;
            });
        })
        .returns ()
        .expectingPropertyToBe ("finalized", true)
        .commit ()
;
