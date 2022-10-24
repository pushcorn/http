const MockIncomingMessage = nit.require ("http.mocks.IncomingMessage");
const MockServerResponse = nit.require ("http.mocks.ServerResponse");
const http = nit.require ("http");

nit.defineClass ("test.handlers.Noop", "http.Handler");


function createTestContext ()
{
    return nit.defineClass ("http.Context", "http.Context", true);
}


test.object ("http.Context")
    .should ("parse the request URL")
        .given (new MockIncomingMessage ("GET", "/users?a=b"), new MockServerResponse)
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.method", "GET")
        .expectingPropertyToBe ("result.path", "/users")
        .expectingPropertyToBe ("result.url", "/users?a=b")
        .expectingPropertyToBe ("result.queryParams", { a: "b" })
        .expectingMethodToReturnValueOfType ("result.responseHeader", "http.Context", "time", 1000)
        .expectingMethodToReturnValue ("result.responseHeader", 1000, "time")
        .expectingMethodToReturnValue ("result.responseHeader", undefined, "x-time")
        .expectingMethodToReturnValueOfType ("result.writeHeaders", "http.Context")
        .expectingPropertyToBe ("result.res.headers", { time: 1000 })
        .commit ()

    .should ("set responseBody to an empty string for bodyless responses")
        .given (new MockIncomingMessage ("GET", "/users?a=b"), new MockServerResponse)
        .after (function ()
        {
            this.result.response = http.responseFor (204);
        })
        .expectingPropertyToBe ("result.responseBody", "")
        .commit ()

    .should ("return a decoded stream through requestStream")
        .given (new MockIncomingMessage ("POST", "/users",
        {
            headers:
            {
                "content-encoding": "gzip"
            }
        }), new MockServerResponse)
        .expectingPropertyToBeOfType ("result.requestStream", require ("zlib").Gunzip)
        .commit ()

    .should ("return non-decoded stream through requestStream if the request has no content-encoding header")
        .given (new MockIncomingMessage ("POST", "/users"), new MockServerResponse)
        .expectingPropertyToBeOfType ("result.requestStream", http.IncomingMessage)
        .commit ()

    .should ("remove the trailing slash from req.path")
        .given (new MockIncomingMessage ("GET", "/users/"), new MockServerResponse)
        .expectingPropertyToBe ("result.path", "/users")
        .commit ()

    .given (new MockIncomingMessage ("GET", "/"), new MockServerResponse)
        .expectingPropertyToBe ("result.path", "/")
        .commit ()
;


test.method (createTestContext (), "create", true)
    .should ("create an instance of Context with mock IncomingMessage and ServerResponse")
        .given ("GET", "/users", { headers: { a: "b" } })
        .after (async function ()
        {
            await this.result.parseRequest ();
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.method", "GET")
        .expectingPropertyToBe ("result.path", "/users")
        .expectingPropertyToBe ("result.headerParams.a", "b")
        .commit ()

    .given ()
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.method", "GET")
        .expectingPropertyToBe ("result.path", "/")
        .expectingPropertyToBe ("result.headerParams", {})
        .commit ()
;


test.method (createTestContext (), "parseRequest",
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

            this.object.appliedRequestFilters = [];

            const InspectSecond = http.request.defineFilter ("test.requset.filters.InspectSecond")
                .orderAfter ("InspectFirst")
                .method ("apply", function (ctx)
                {
                    ctx.appliedRequestFilters.push (this.constructor.simpleName);
                })
            ;

            const InspectFirst = http.request.defineFilter ("test.requset.filters.InspectFirst")
                .method ("apply", function (ctx)
                {
                    ctx.appliedRequestFilters.push (this.constructor.simpleName);
                })
            ;

            const InspectThird = http.request.defineFilter ("test.requset.filters.InspectThird")
                .condition ("http:custom", () => false)
                .method ("apply", function (ctx)
                {
                    ctx.appliedRequestFilters.push (this.constructor.simpleName);
                })
            ;

            this.class
                .requestFilter (new InspectThird)
                .requestFilter (new InspectSecond)
                .requestFilter (new InspectFirst)
            ;
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.cookieParams", { a: "b", c: "d", e: "f" })
        .expectingPropertyToBe ("result.headerParams", { "access-token": "12345" })
        .expectingPropertyToBe ("result.appliedRequestFilters", ["InspectFirst", "InspectSecond"])
        .commit ()
;


test.method ("http.Context", "parseRequest",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("merge requestBody to formParams if available")
        .before (function ()
        {
            this.object.requestBody = { a: 9 };
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.formParams", { a: 9 })
        .commit ()
;


test.method ("http.Context", "vary",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("set the vary header")
        .given ("User-Agent", "X-Status")
        .returnsInstanceOf ("http.Context")
        .expectingMethodToReturnValue ("object.responseHeader", "User-Agent, X-Status", "vary")
        .commit ()

    .given ("HeaderA")
        .after (function ()
        {
            this.object.vary ("HeaderB");
        })
        .expectingMethodToReturnValue ("object.responseHeader", "HeaderA, HeaderB", "vary")
        .commit ()
;


test.method ("http.Context", "acceptsType",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("return the preferred response content type")
        .given ("text/html")
        .returns ("text/html")
        .commit ()

    .given ("text/html")
        .before (function ()
        {
            this.createArgs[0].headers = { accept: "application/json" };
        })
        .returns ()
        .commit ()
;


test.method ("http.Context", "acceptsEncoding",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("return the preferred response encoding")
        .given ("gzip")
        .returns ()
        .commit ()

    .given ("gzip")
        .before (function ()
        {
            this.createArgs[0].headers = { "accept-encoding": "deflate, gzip" };
        })
        .returns ("gzip")
        .commit ()
;


test.method ("http.Context", "acceptsCharset",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("return the preferred response encoding")
        .given ("iso-8859-5")
        .returns ("iso-8859-5")
        .commit ()

    .given ("iso-8859-5")
        .before (function ()
        {
            this.createArgs[0].headers = { "accept-charset": "utf-8" };
        })
        .returns ()
        .commit ()
;


test.method ("http.Context", "acceptsLanguage",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("return the preferred response language")
        .given ("en")
        .returns ("en")
        .commit ()

    .given ("en")
        .before (function ()
        {
            this.createArgs[0].headers = { "accept-language": "fr" };
        })
        .returns ()
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


test.method ("http.Context", "writeResponse",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })

    .should ("skip if res.writableEnded is true")
        .before (function ()
        {
            nit.dpv (this.createArgs[1], "writableEnded", true, true);
        })
        .mock ("object", "writeHeaders", function () {})
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()

    .should ("skip if the response is Noop")
        .before (function ()
        {
            nit.dpv (this.createArgs[1], "writableEnded", false, true);
            this.object.response = nit.new ("http.responses.Noop");
        })
        .mock ("object", "writeHeaders", function () {})
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()

    .should ("throw if the response was not set")
        .before (function ()
        {
            nit.dpv (this.createArgs[1], "writableEnded", false, true);
            this.object.response = null;
        })
        .throws ("error.response_not_set")
        .commit ()

    .should ("pipe the response body to res if it's a stream")
        .before (function ()
        {
            let resolve;

            this.object.response = nit.new ("http.responses.FileReturned", "package.json");
            this.onResFinish = new Promise (res => resolve = res);
            this.object.res.on ("finish", function ()
            {
                resolve ();
            });
        })
        .after (async function ()
        {
            await this.onResFinish;
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.res.data", /@pushcorn\/http/)
        .commit ()
;


test.method (createTestContext (), "writeResponse",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("apply the response filters")
        .before (function ()
        {
            this.object.appliedResponseFilters = [];
            this.object.response = nit.new ("http.responses.RequestSucceeded");
            this.object.responseHeader ("x-server", "nit");

            const FilterTwo = http.response.defineFilter ("test.response.filters.FilterTwo")
                .orderAfter ("FilterOne")
                .method ("apply", function (ctx)
                {
                    ctx.appliedResponseFilters.push (this.constructor.simpleName);
                })
            ;

            const FilterOne = http.response.defineFilter ("test.response.filters.FilterOne")
                .method ("apply", function (ctx)
                {
                    ctx.appliedResponseFilters.push (this.constructor.simpleName);
                })
            ;

            const FilterThree = http.response.defineFilter ("test.response.filters.FilterThree")
                .orderAfter ("FilterTwo")
                .condition ("http:custom", function ()
                {
                    return false;
                })
                .method ("apply", function (ctx)
                {
                    ctx.appliedResponseFilters.push (this.constructor.simpleName);
                })
            ;

            this.class
                .responseFilter (new FilterTwo)
                .responseFilter (new FilterOne)
                .responseFilter (new FilterThree)
            ;
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.appliedResponseFilters", ["FilterOne", "FilterTwo"])
        .expectingPropertyToBe ("result.res.headers",
        {
            "Content-Length": 87,
            "Content-Type": "application/json",
            "x-server": "nit"
        })
        .commit ()
;
