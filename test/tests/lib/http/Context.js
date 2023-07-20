const MockServerResponse = nit.require ("http.mocks.ServerResponse");
const MockIncomingMessage = nit.require ("http.mocks.IncomingMessage");
const http = nit.require ("http");


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
        .expectingMethodToReturnValueOfType ("result.responseHeader", ["time", 1000], "http.Context")
        .expectingMethodToReturnValue ("result.responseHeader", "time", 1000)
        .expectingMethodToReturnValue ("result.responseHeader", "x-time")
        .expectingMethodToReturnValueOfType ("result.writeHeaders", null, "http.Context")
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


test.method (createTestContext (), "new", true)
    .should ("create an instance of Context with mock IncomingMessage and ServerResponse")
        .given ("GET", "/users", { headers: { a: "b" } })
        .after (async function ()
        {
            await this.result.readRequest ();
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


test.method ("http.Context", "buildRequest",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users/123?a=b&c=d"),
            new MockServerResponse
        ]
    })
    .should ("build the request from parameters")
        .before (async (s) =>
        {
            const User = s.User = nit.defineClass ("UserRequest", "http.Request")
                .path ("<id>", "string")
                .parameter ("a", "string")
                .parameter ("c", "string")
            ;

            s.object.pathParser = nit.new ("http.PathParser", "/users/:id");
            s.object.requestBody = { a: 9 };
            s.args = User;

            await s.object.readRequest ();
        })
        .returnsInstanceOf ("UserRequest")
        .expectingPropertyToBe ("result.id", "123")
        .expectingPropertyToBe ("result.a", "9")
        .expectingPropertyToBe ("result.c", "d")
        .commit ()

    .should ("throw if the param validation failed")
        .before (async (s) =>
        {
            s.object.pathParser = nit.new ("http.PathParser", "/users/:id");
            s.object.requestBody = { a: 9 };
            s.args = s.User;
        })
        .throws ("error.model_validation_failed")
        .expectingPropertyToBe ("error.context.validationContext.violations.0.field", "id")
        .commit ()
;


test.method (createTestContext (), "readRequest",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
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

            const InspectSecond = http.defineRequestFilter ("InspectSecond")
                .orderAfter ("InspectFirst")
                .method ("apply", function (ctx)
                {
                    ctx.appliedRequestFilters.push (this.constructor.simpleName);
                })
            ;

            const InspectFirst = http.defineRequestFilter ("InspectFirst")
                .method ("apply", function (ctx)
                {
                    ctx.appliedRequestFilters.push (this.constructor.simpleName);
                })
            ;

            const InspectThird = http.defineRequestFilter ("InspectThird")
                .condition ("http:custom", () => false)
                .method ("apply", function (ctx)
                {
                    ctx.appliedRequestFilters.push (this.constructor.simpleName);
                })
            ;

            this.class
                .requestfilter (new InspectThird)
                .requestfilter (new InspectSecond)
                .requestfilter (new InspectFirst)
            ;
        })
        .returns ()
        .expectingPropertyToBe ("object.queryParams", { a: "b" })
        .expectingPropertyToBe ("object.cookieParams", { a: "b", c: "d", e: "f" })
        .expectingPropertyToBe ("object.headerParams", { "access-token": "12345" })
        .expectingPropertyToBe ("object.appliedRequestFilters", ["InspectFirst", "InspectSecond"])
        .commit ()
;


test.method ("http.Context", "readRequest",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users/123?a=b"),
            new MockServerResponse
        ]
    })
    .should ("merge requestBody to formParams if available")
        .before (function ()
        {
            const User = nit.defineClass ("UserRequest", "http.Request")
                .path ("<id>", "string")
            ;

            this.object.pathParser = nit.new ("http.PathParser", "/users/:id");
            this.object.requestBody = { a: 9 };
            this.args.push (User);
        })
        .returns ()
        .expectingPropertyToBe ("object.pathParams", { id: "123" })
        .expectingPropertyToBe ("object.formParams", { a: 9 })
        .expectingPropertyToBeOfType ("object.request", "UserRequest")
        .expectingPropertyToBe ("object.request.id", "123")
        .expectingMethodToReturnValue ("object.readRequest", null, s => s.object.request)
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
        .expectingMethodToReturnValue ("object.responseHeader", "vary", "User-Agent, X-Status")
        .commit ()

    .given ("HeaderA")
        .after (function ()
        {
            this.object.vary ("HeaderB");
        })
        .expectingMethodToReturnValue ("object.responseHeader", "vary", "HeaderA, HeaderB")
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
            new MockServerResponse
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
;


test.method ("http.Context", "noop",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("send the noop response")
    .expectingPropertyToBeOfType ("object.response", "http.responses.Noop")
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
        .before (s =>
        {
            s.createArgs[1].writableEnded = true;
        })
        .mock ("object", "writeHeaders", function () {})
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()

    .should ("skip if the response is Noop")
        .before (s =>
        {
            s.createArgs[1].writableEnded = false;
            s.object.response = nit.new ("http.responses.Noop");
        })
        .mock ("object", "writeHeaders", function () {})
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()

    .should ("throw if the response was not set")
        .before (s =>
        {
            s.createArgs[1].writableEnded = false;

            s.object.response = null;
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

            const FilterTwo = http.defineResponseFilter ("FilterTwo")
                .orderAfter ("FilterOne")
                .method ("apply", function (ctx)
                {
                    ctx.appliedResponseFilters.push (this.constructor.simpleName);
                })
            ;

            const FilterOne = http.defineResponseFilter ("FilterOne")
                .method ("apply", function (ctx)
                {
                    ctx.appliedResponseFilters.push (this.constructor.simpleName);
                })
            ;

            const FilterThree = http.defineResponseFilter ("FilterThree")
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
                .responsefilter (new FilterTwo)
                .responsefilter (new FilterOne)
                .responsefilter (new FilterThree)
            ;
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.appliedResponseFilters", ["FilterOne", "FilterTwo"])
        .expectingPropertyToBe ("result.res.headers",
        {
            "Content-Length": 2,
            "Content-Type": "application/json",
            "x-server": "nit",
            "X-Response-Name": "RequestSucceeded"
        })
        .commit ()
;


test.method (createTestContext (), "redirect",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "http://localhost/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("redirect the client")
        .given (308, "http://a.b.com")
        .expectingPropertyToBe ("object.status", 308)
        .expectingPropertyToBe ("object.responseHeaders.Location", "http://a.b.com")
        .commit ()

    .should ("accept partial changes to the URL")
        .given ({ pathname: "/projects" })
        .expectingPropertyToBe ("object.status", 302)
        .expectingPropertyToBe ("object.responseHeaders.Location", "http://localhost/projects?a=b")
        .commit ()
;


test.method (createTestContext (), "enter",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "http://localhost/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("set the new path and store the old one")
        .given ("/api/users")
        .expectingPropertyToBe ("object.path", "/api/users")
        .expectingPropertyToBe ("object.pathOverrides", ["/api/users"])
        .commit ()

    .should ("use '/' if not path were given")
        .given ()
        .expectingPropertyToBe ("object.path", "/")
        .expectingPropertyToBe ("object.pathOverrides", ["/"])
        .commit ()
;


test.method (createTestContext (), "leave",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "http://localhost/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("remove the last path override")
        .before (s => s.object.enter ("/api/users"))
        .expectingPropertyToBe ("object.path", "/users")
        .expectingPropertyToBe ("object.pathOverrides", [])
        .commit ()
;
