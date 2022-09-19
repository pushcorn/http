const MockIncomingMessage = nit.require ("http.MockIncomingMessage");
const MockServerResponse = nit.require ("http.MockServerResponse");


test.method ("http.Handler", "middleware", true)
    .should ("add the middleware to the middlewares array")
        .before (function ()
        {
            nit.defineClass ("http.middlewares.DoSomething", "http.Handler.Middleware");
        })
        .given ("http:do-something")
        .commit ()
;


test.method ("http.Handler", "response", true)
    .should ("register a response type")
        .given ("http:request-failed")
        .expectingPropertyToBe ("object.responses.length", 1)
        .expectingPropertyToBe ("object.responses.0", nit.require ("http.responses.RequestFailed"))
        .commit ()
;


test.method (nit.defineClass ("http.MyHandler", "http.Handler", true), "defineRequest", true)
    .should ("define a handler specific request")
        .expectingPropertyToBe ("object.Request.name", "http.MyHandler.Request")
        .commit ()
;


test.method (nit.defineClass ("http.Handler", "http.Handler", true), "run", true)
    .should ("register the run callback")
        .given (nit.noop)
        .expecting ("the run callback is nit.noop", nit.noop, function ({ object })
        {
            return object["http.Handler.run"];
        })
        .commit ()
;


test.method (nit.defineClass ("http.Handler", "http.Handler", true), "runMiddlewares", true)
    .should ("run the specifed method of all middlewares")
        .before (function ()
        {
            const Audit = nit.defineClass ("test.middlewares.Audit", "http.Handler.Middleware")
                .method ("onComplete", function (ctx)
                {
                    Audit.onCompleteCalled = true;
                    Audit.onCompleteCtx = ctx;
                })
            ;

            this.object.middleware ("test:audit");
            this.Audit = Audit;
        })
        .given ("onComplete", { a: 1 })
        .expectingPropertyToBe ("Audit.onCompleteCalled", true)
        .expectingPropertyToBe ("Audit.onCompleteCtx", { a: 1 })
        .commit ()
;


test.method (nit.defineClass ("http.MyHandler", "http.Handler", true), "buildRequest")
    .should ("create a new request from the context parameters")
        .given (nit.new ("http.Context",
            new MockIncomingMessage ("POST", "/resources/100?time=5555",
            {
                headers: { "api-key": "1234" },
                cookies: { trackingToken: "5678", sessionId: "abcd" }
            }),
            new MockServerResponse,
            {
                route: nit.new ("http.Route", "POST", "/resources/:resourceId"),
                formParams:
                {
                    secret: "xyz"
                }
            }
        ))
        .before (async function ()
        {
            await this.args[0].parseRequest ();

            this.class.defineRequest (Request =>
            {
                Request
                    .header ("api-key")
                    .query ("time", "integer")
                    .path ("resourceId", "integer")
                    .cookie ("trackingToken")
                    .form ("secret")
                    .parameter ("sessionId")
                ;
            });
        })
        .returnsInstanceOf ("http.MyHandler.Request")
        .expectingPropertyToBe ("result.api-key", "1234")
        .expectingPropertyToBe ("result.time", 5555)
        .expectingPropertyToBe ("result.resourceId", 100)
        .expectingPropertyToBe ("result.trackingToken", "5678")
        .expectingPropertyToBe ("result.secret", "xyz")
        .expectingPropertyToBe ("result.sessionId", "abcd")
        .commit ()
;


test.method (nit.defineClass ("http.MyHandler", "http.Handler", true), "run")
    .before (async function ()
    {
        const ResourceCreated = nit.defineClass ("test.responses.ResourceCreated", "http.Response")
            .info (201, "The resource has been created.")
            .field ("<id>", "string", "The resource ID.")
            .field ("[name]", "string", "The resource name.")
        ;

        this.class
            .defineRequest (Request =>
            {
                Request.form ("name");
            })
            .run (function (ctx)
            {
                return new ResourceCreated ("1111", ctx.request.name);
            })
        ;

        this.ctx = nit.new ("http.Context",
            new MockIncomingMessage ("POST", "/resources"),
            new MockServerResponse,
            {
                route: nit.new ("http.Route", "POST", "/resources"),
                formParams:
                {
                    name: "new resource"
                }
            }
        );

        this.args.push (this.ctx);

        await this.ctx.parseRequest ();
    })
    .snapshot ()

    .should ("run the handler and middlewares")
        .expectingPropertyToBe ("ctx.sent", false)
        .expectingPropertyToBeOfType ("ctx.response", "test.responses.ResourceCreated")
        .expectingMethodToReturnValue ("ctx.response.toPojo",
        {
            "@name": "ResourceCreated",
            "@status": 201,
            "@message": "The resource has been created.",
            "id": "1111",
            "name": "new resource"
        })
        .commit ()

    .should ("not the the handler if a response was generated in the pre/postRequest phase")
        .before (function ()
        {
            const RespondOnPreRequest = nit.defineClass ("test.middlewares.RespondOnPreRequest", "http.Handler.Middleware")
                .method ("preRequest", function (ctx)
                {
                    ctx.response = nit.new ("http.responses.AccessUnauthorized");
                })
            ;

            this.class.middlewares.push (new RespondOnPreRequest);
        })
        .expectingPropertyToBeOfType ("ctx.response", "http.responses.AccessUnauthorized")
        .commit ()

    .should ("set the response to ResourceNotFound if the handler did not implement the run callback")
        .before (function ()
        {
            this.class["http.Handler.run"] = undefined;
            this.class.middlewares = [];
        })
        .expectingPropertyToBeOfType ("ctx.response", "http.responses.ResourceNotFound")
        .commit ()

    .should ("set the response to RequestSucceeded if the run callback is implemented but did not return a response")
        .before (function ()
        {
            this.class.run (function () {});
        })
        .expectingPropertyToBeOfType ("ctx.response", "http.responses.RequestSucceeded")
        .commit ()

    .should ("set the response to RequestFailed if handler throws an error")
        .before (function ()
        {
            this.class.run (function (ctx)
            {
                ctx.response = nit.new ("http.responses.AccessUnauthorized");
                nit.throw ("error.bad_thing_happened");
            });

            const Audit = nit.defineClass ("test.middlewares.Audit", "http.Handler.Middleware")
                .method ("onComplete", function (ctx)
                {
                    Audit.onCompleteCalled = true;
                    Audit.onCompleteCtx = ctx;
                })
            ;

            this.class.middleware ("test:audit");
            this.Audit = Audit;
        })
        .throws ("error.bad_thing_happened")
        .expectingPropertyToBeOfType ("ctx.response", "http.responses.AccessUnauthorized")
        .expectingPropertyToBe ("Audit.onCompleteCalled", true)
        .commit ()
;
