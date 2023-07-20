const http = nit.require ("http");
const Context = nit.require ("http.Context");

function defineApi ()
{
    return http.defineApi ("http.Api", true);
}


test.method (defineApi ().Context, "send")
    .should ("throw if the argument is not a response and the API does not define any response")
        .up (s => s.createArgs = Context.new ("GET", "/"))
        .given ("the data")
        .throws ("error.no_default_response")
        .commit ()

    .should ("create the response if the first argument is not an instance of response")
        .up (s => s.createArgs = Context.new ("GET", "/"))
        .before (s => s.class.outerClass.response ("http:request-succeeded"))
        .given ("the data")
        .expectingPropertyToBeOfType ("result.response", "http.responses.RequestSucceeded")
        .expectingPropertyToBe ("result.response.data", "the data")
        .commit ()

    .should ("just send the response if it is an instance of response")
        .up (s => s.createArgs = Context.new ("GET", "/"))
        .given (nit.new ("http.responses.RequestFailed", "error!"))
        .expectingPropertyToBeOfType ("result.response", "http.responses.RequestFailed")
        .expectingPropertyToBe ("result.response.data", "error!")
        .commit ()
;


test.method (defineApi (), "run")
    .should ("run the apis and plugins")
        .init (function ()
        {
            const Plugin = http.defineApiPlugin ("TestPlugin");

            this.plugin = new Plugin;
            this.class.apiplugin (this.plugin);
        })
        .given (Context.new ("GET", "/"))
        .mock ("plugin", "preRun")
        .mock ("plugin", "postRun")
        .expectingPropertyToBeOfType ("plugin", "http.apiplugins.TestPlugin")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()

    .should ("throw if the returned response was not in the list of allowed responses")
        .given (Context.new ("GET", "/"))
        .before (function ()
        {
            this.class.response ("http:file-returned");
            this.class.onRun (ctx => ctx.noop ());
        })
        .mock ("plugin", "preCatch")
        .mock ("plugin", "postCatch")
        .throws ("error.response_not_allowed")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()

    .should ("throw if the context cannot be constructed")
        .given (Context.new ("GET", "/"))
        .before (function ()
        {
            this.class.Context.onConstruct (() => { throw 455; }); // eslint-disable-line no-throw-literal
        })
        .mock ("plugin", "preFinally")
        .mock ("plugin", "postFinally")
        .throws (455)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", undefined)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()
;


test.method (defineApi (), "catch")
    .should ("throw the error if no catch handler defined")
        .given (Context.new ())
        .before (s =>
        {
            s.args[0].error = new Error ("UNKNOWN");
        })
        .throws ("UNKNOWN")
        .commit ()

    .should ("call catch handler if defined")
        .given (Context.new ())
        .before (s =>
        {
            s.class.onCatch (ctx =>
            {
                s.err = ctx.error;
            });

            s.args[0].error = new Error ("UNKNOWN");
        })
        .returns ()
        .expectingPropertyToBe ("err.message", "UNKNOWN")
        .commit ()
;


test.method (defineApi (), "finally")
    .should ("call finally handler if defined")
        .given (Context.new ())
        .before (s =>
        {
            s.class.onFinally (() =>
            {
                s.finalized = true;
            });
        })
        .returns ()
        .expectingPropertyToBe ("finalized", true)
        .commit ()
;


test.method ("http.Api.Descriptor", "build")
    .should ("build the api and add it to the service")
        .given (nit.new ("http.Service"))
        .commit ()

    .should ("use the API for the specified name")
        .project ("myapp")
        .up (function ()
        {
            this.createArgs = { name: "myapp:hello" };
        })
        .given (nit.new ("http.Service"))
        .commit ()

    .should ("add the conditions for the specified endpoint")
        .given (nit.new ("http.Service"))
        .up (function ()
        {
            this.createArgs = { endpoint: "POST /items" };
        })
        .expectingPropertyToBe ("result.constructor.conditions.length", 2)
        .expectingPropertyToBe ("result.constructor.conditions.0.method", "POST")
        .expectingPropertyToBe ("result.constructor.conditions.1.path", "/items")
        .commit ()

    .should ("add the specified conditions and plugins to the api")
        .given (nit.new ("http.Service"))
        .up (function ()
        {
            nit.require ("http.Api");

            http.defineApiPlugin ("Counter");

            this.createArgs =
            {
                conditions:
                [
                {
                    name: "http:hostname",
                    options: "app.pushcorn.com"
                }
                ]
                ,
                plugins: ["http:counter"]
            };
        })
        .expectingPropertyToBe ("result.constructor.conditions.length", 1)
        .expectingPropertyToBe ("result.constructor.conditions.0.hostnames", ["app.pushcorn.com"])
        .expectingPropertyToBe ("result.constructor.apiplugins.length", 1)
        .commit ()
;
