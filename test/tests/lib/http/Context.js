const MockServerResponse = nit.require ("http.mocks.ServerResponse");
const MockIncomingMessage = nit.require ("http.mocks.IncomingMessage");
const http = nit.require ("http");


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
        .after (async (s) =>
        {
            s.result.response = http.responseFor (204);

            await s.result.writeResponse ();
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


test.method ("http.Context", "new", true)
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

            s.object.pathParams = nit.new ("http.PathParser", "/users/:id").parse (s.object.path);
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
            s.args = s.User;
        })
        .throws ("error.model_validation_failed")
        .expectingPropertyToBe ("error.context.validationContext.violations.0.field", "id")
        .commit ()
;


test.method ("http.Context", "readRequest",
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

            this.object.requestFilters.push (new InspectThird, new InspectSecond, new InspectFirst);
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

            this.object.pathParams = nit.new ("http.PathParser", "/users/:id").parse (this.object.path);
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
        .after (async (s) => await s.object.writeResponse ())
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
        .before (async (s) =>
        {
            s.object.send ("http:request-failed");

            await s.object.writeResponse ();
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


test.method ("http.Context", "sendJson",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("send the JSON response")
    .given ({ a: 1 })
    .after (async (s) => await s.object.writeResponse ())
    .expectingPropertyToBeOfType ("object.response", "http.responses.Json")
    .expectingPropertyToBe ("object.responseHeaders.Content-Length", 7)
    .commit ()
;


test.method ("http.Context", "sendText",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("send the text response")
    .given ("this is a test")
    .after (async (s) => await s.object.writeResponse ())
    .expectingPropertyToBeOfType ("object.response", "http.responses.Text")
    .expectingPropertyToBe ("object.responseHeaders.Content-Length", 14)
    .commit ()
;


test.method ("http.Context", "sendData",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("send the data response")
    .given (Buffer.from ("abcd"))
    .after (async (s) => await s.object.writeResponse ())
    .expectingPropertyToBeOfType ("object.response", "http.responses.Data")
    .expectingPropertyToBe ("object.responseHeaders.Content-Length", 4)
    .commit ()
;


test.method ("http.Context", "sendFile",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/users?a=b"),
            new MockServerResponse
        ]
    })
    .should ("send the specified file")
    .given (nit.path.join (test.TEST_PROJECT_PATH, "../package.json"))
    .after (s => s.object.writeResponse ())
    .expectingPropertyToBeOfType ("object.response", "http.responses.File")
    .expectingPropertyToBe ("object.responseHeaders.Content-Type", "application/json")
    .commit ()
;


test.method ("http.Context", "render",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/"),
            new MockServerResponse
        ]
    })
    .should ("render the view template with the given data")
    .before (s => s.object.service = s.createService (
    {
        assetResolvers: { roots: "resources/html" }
    }))
    .given ("file://hello.html", { firstname: "John" })
    .after (s => s.object.writeResponse ())
    .expectingPropertyToBeOfType ("object.response", "http.responses.View")
    .expectingPropertyToBe ("object.responseHeaders.Content-Type", "text/html")
    .expectingPropertyToBe ("object.responseBody", "Hello John!\n")
    .commit ()
;


test.method ("http.Context", "loadTemplate",
    {
        createArgs:
        [
            new MockIncomingMessage ("GET", "/"),
            new MockServerResponse
        ]
    })
    .should ("load the view template")
        .before (s => s.object.service = s.createService (
        {
            assetResolvers: { roots: "resources/html" },
            templateLoaders: { extensions: "html" }
        }))
        .given ("page-one.html")
        .returns (nit.trim.text`
            This is page one.
            This is page two!
        ` + "\n\n")
        .commit ()

    .should ("return undefined if the template cannot be found")
        .given ("page-01.html")
        .returns ()
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
        .before (s =>
        {
            let resolve;

            s.object.response = nit.new ("http.responses.File", nit.path.join (test.TEST_PROJECT_PATH, "../package.json"));
            s.onResFinish = new Promise (res => resolve = res);
            s.object.res.on ("finish", function ()
            {
                resolve ();
            });
        })
        .after (async (s) =>
        {
            await s.onResFinish;
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.res.data", /@pushcorn\/http/)
        .commit ()
;


test.method ("http.Context", "writeResponse")
    .should ("apply the response filters")
        .up (s => s.createArgs = [new MockIncomingMessage ("GET", "/"), new MockServerResponse])
        .before (function ()
        {
            this.object.appliedResponseFilters = [];
            this.object.response = nit.new ("http.responses.Json", { json: { v: 1 } });
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

            this.object.responseFilters.push (new FilterTwo, new FilterOne, new FilterThree);
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.appliedResponseFilters", ["FilterOne", "FilterTwo"])
        .expectingPropertyToBe ("result.res.headers",
        {
            "Content-Length": 7,
            "Content-Type": "application/json",
            "x-server": "nit"
        })
        .commit ()

    .should ("rebuild the response body if the response is changed by a response filter")
        .up (s => s.createArgs = [new MockIncomingMessage ("GET", "/"), new MockServerResponse])
        .before (function ()
        {
            this.object.appliedResponseFilters = [];
            this.object.response = nit.new ("http.responses.Json", { json: { v: 1 } });

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
                    ctx.sendText ("filter one!");
                })
            ;

            const FilterThree = http.defineResponseFilter ("FilterThree")
                .orderAfter ("FilterTwo")
                .condition ("http:custom", function ()
                {
                    return true;
                })
                .method ("apply", function (ctx)
                {
                    ctx.appliedResponseFilters.push (this.constructor.simpleName);
                })
            ;

            this.object.responseFilters.push (new FilterTwo, new FilterOne, new FilterThree);
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.appliedResponseFilters", ["FilterOne", "FilterTwo", "FilterThree"])
        .expectingPropertyToBe ("result.res.headers",
        {
            "Content-Length": 11,
            "Content-Type": "text/plain"
        })
        .commit ()

    .should ("clear the content-length header if it cannnot be determined")
        .up (s => s.createArgs = [new MockIncomingMessage ("GET", "/"), new MockServerResponse])
        .before (function ()
        {
            this.object.appliedResponseFilters = [];
            this.object.response = nit.new ("http.responses.Json", { json: { v: 1 } });

            const StreamResponse = http.defineResponse ("Stream")
                .method ("toBody", function ()
                {
                    return nit.fs.createReadStream (__filename);
                })
            ;

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
                    ctx.sendText ("filter one!");
                })
            ;

            const FilterThree = http.defineResponseFilter ("FilterThree")
                .orderAfter ("FilterTwo")
                .condition ("http:custom", function ()
                {
                    return true;
                })
                .method ("apply", function (ctx)
                {
                    ctx.response = new StreamResponse ();
                    ctx.appliedResponseFilters.push (this.constructor.simpleName);
                })
            ;

            this.object.responseFilters.push (new FilterTwo, new FilterOne, new FilterThree);
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.appliedResponseFilters", ["FilterOne", "FilterTwo", "FilterThree"])
        .expectingPropertyToBe ("result.res.headers",
        {
            "Content-Type": "text/plain"
        })
        .commit ()
;


test.method ("http.Context", "redirect",
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


test.method ("http.Context", "enter",
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


test.method ("http.Context", "leave",
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


test.method ("http.Context", "resolveAsset")
    .should ("return the absolute path of the given path")
        .up (s => s.createArgs =
        {
            req: new MockIncomingMessage ("GET", "/"),
            res: new MockServerResponse,
            assetResolvers: { roots: "public" }
        })
        .given ("index.html")
        .returns (nit.path.join (test.TEST_PROJECT_PATH, "../public/index.html"))
        .commit ()

    .should ("return undefined if the given path was invalid")
        .up (s => s.createArgs =
        {
            req: new MockIncomingMessage ("GET", "/"),
            res: new MockServerResponse,
            assetResolvers: { roots: "public" }
        })
        .given ("index2.html")
        .returns ()
        .commit ()
;


test.method ("http.Context", "loadTemplate")
    .should ("return the template for the given path")
        .up (s => s.createArgs =
        {
            req: new MockIncomingMessage ("GET", "/"),
            res: new MockServerResponse,
            assetResolvers: { roots: "public" }
        })
        .given ("index.html")
        .returns (/^<!DOCTYPE html>/)
        .commit ()

    .should ("use the template loaders to load the template")
        .up (s => s.createArgs =
        {
            req: new MockIncomingMessage ("GET", "/"),
            res: new MockServerResponse,
            assetResolvers: { roots: "public" },
            templateLoaders: { extensions: ".html" }
        })
        .given ("index.html")
        .returns (/^<!DOCTYPE html>/)
        .expecting ("the template was parsed by the loader", true, s => !s.result.includes ("{%"))
        .commit ()

    .should ("return undefined if the template cannot be loaded")
        .up (s => s.createArgs =
        {
            req: new MockIncomingMessage ("GET", "/"),
            res: new MockServerResponse,
            assetResolvers: { roots: "public" }
        })
        .given ("index2.html")
        .returns ()
        .commit ()
;
