const MockIncomingMessage = nit.require ("http.mocks.IncomingMessage");
const MockServerResponse = nit.require ("http.mocks.ServerResponse");

nit.defineClass ("test.handlers.Noop", "http.Handler");


test.object ("http.Context")
    .should ("parse the request URL")
        .given (new MockIncomingMessage ("GET", "/users?a=b"), new MockServerResponse)
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.method", "GET")
        .expectingPropertyToBe ("result.path", "/users")
        .expectingPropertyToBe ("result.url", "/users?a=b")
        .expectingPropertyToBe ("result.queryParams", { a: "b" })
        .expectingMethodToReturnValue ("result.responseHeader", undefined, "time", 1000)
        .expectingMethodToReturnValue ("result.responseHeader", 1000, "time")
        .expectingMethodToReturnValue ("result.writeHeaders")
        .expectingPropertyToBe ("result.res.headers", { time: 1000 })
        .commit ()

    .should ("throw when accessing an uninitialized field")
        .given (new MockIncomingMessage ("GET", "/users?a=b"), new MockServerResponse)
        .expecting ("accessing server will result in error", "error.field_not_initialized", function ({ result })
        {
            try { return result.server; } catch (e) { return e.code; }
        })
        .commit ()

    .given (new MockIncomingMessage ("GET", "/users?a=b"), new MockServerResponse)
        .expecting ("accessing service will result in error", "error.field_not_initialized", function ({ result })
        {
            try { return result.service; } catch (e) { return e.code; }
        })
        .commit ()

    .given (new MockIncomingMessage ("GET", "/users?a=b"), new MockServerResponse)
        .expecting ("accessing route will result in error", "error.field_not_initialized", function ({ result })
        {
            try { return result.route ; } catch (e) { return e.code; }
        })
        .commit ()

    .given (new MockIncomingMessage ("GET", "/users?a=b"), new MockServerResponse)
        .expecting ("accessing handler will result in error", "error.field_not_initialized", function ({ result })
        {
            try { return result.handler; } catch (e) { return e.code; }
        })
        .commit ()
;


test.method ("http.Context", "parseRequest",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse,
            {
                route: nit.new ("http.Route", "GET", "/users")
            }
        ]
    })
    .should ("parse the request headers and cookies")
        .before (function ()
        {
            this.object.req.cookies =
            {
                e: "f"
            };

            this.object.req.headers =
            {
                cookie: "a=b; c=d",
                "access-token": "12345"
            };
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.cookieParams", { a: "b", c: "d", e: "f" })
        .expectingPropertyToBe ("result.headerParams", { "access-token": "12345" })
        .commit ()
;


test.method ("http.Context", "send")
    .up (function ()
    {
        this.createArgs =
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse,
            {
                handler: nit.new ("test.handlers.Noop")
            }
        ];
    })
    .snapshot ()

    .should ("send the response")
        .given ("http:request-failed")
        .expectingPropertyToBeOfType ("object.response", "http.responses.RequestFailed")
        .expectingPropertyToBe ("object.sent", true)
        .expecting ("the sent property cannot be changed", true, function ({ object })
        {
            object.sent = false;

            return object.sent;
        })
        .commit ()

    .should ("throw if a response has been sent")
        .given ("http:request-failed")
        .before (function ()
        {
            this.object.send ("http:request-failed");
        })
        .throws ("error.response_sent")
        .commit ()

    .should ("throw if a response has not been set")
        .throws ("error.response_not_set")
        .commit ()

    .should ("throw if the response is not declared by the handler")
        .before (function ()
        {
            const Handler = nit.defineClass ("Handler", "http.Handler")
                  .response ("http:request-succeeded")
            ;

            this.object.handler = new Handler ();
        })
        .given ("http:request-failed")
        .throws ("error.response_not_allowed")
        .commit ()
;
