const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");
const http = nit.require ("http");


test.object (http)
    .should ("define the IncomingMessage and ServerResponse inner classes")
        .expecting ("http.IncomingMessage is from node", true, function (strategy)
        {
            return strategy.object.IncomingMessage == require ("http").IncomingMessage;
        })
        .expecting ("http.ServerResponse is from node", true, function (strategy)
        {
            return strategy.object.ServerResponse == require ("http").ServerResponse;
        })
        .commit ()
;


test.object ("http.IncomingMessage")
    .should ("have some useful properties")
        .after (function ()
        {
            let m = this.result;

            m.httpVersion = "1.1";
            m.socket = { remoteAddress: "127.0.0.1" };
            m.headers =
            {
                "host": "localhost",
                "user-agent": "nit",
                "content-type": "application/json; charset=UTF-8"
            };
        })
        .expectingPropertyToBe ("result.hostname", "localhost")
        .expectingPropertyToBe ("result.protocol", "http")
        .expectingPropertyToBe ("result.ip", "127.0.0.1")
        .expectingPropertyToBe ("result.realIp", "127.0.0.1")
        .expectingPropertyToBe ("result.userAgent", "nit")
        .expectingPropertyToBe ("result.contentType", "application/json")
        .commit ()

    .should ("use return the value of x-forwarded-for for realIp if available")
        .after (function ()
        {
            let m = this.result;

            m.headers =
            {
                host: "localhost",
                "x-forwarded-for": "1.2.3.4",
                "x-forwarded-proto": "https"
            };

            m.socket = { remoteAddress: "127.0.0.1" };
        })
        .expectingPropertyToBe ("result.realIp", "1.2.3.4")
        .expectingPropertyToBe ("result.protocol", "https")
        .expectingPropertyToBe ("result.userAgent", "")
        .expectingPropertyToBe ("result.contentType", "")
        .commit ()

    .should ("use :authority header for hostname if http2 was used")
        .after (function ()
        {
            let m = this.result;

            m.httpVersion = "2.0";
            m.headers = { host: "localhost", ":authority": "localhost2" };
        })
        .expectingPropertyToBe ("result.hostname", "localhost2")
        .commit ()

    .should ("use ip for hostname if no host header available")
        .after (function ()
        {
            let m = this.result;

            m.headers = {};
            m.httpVersion = "1.0";
            m.socket = { remoteAddress: "127.0.0.1", encrypted: true };
        })
        .expectingPropertyToBe ("result.hostname", "127.0.0.1")
        .expectingPropertyToBe ("result.host", "127.0.0.1")
        .expectingPropertyToBe ("result.protocol", "https")
        .commit ()

    .should ("return an empty string for host if it cannot be determined")
        .after (function ()
        {
            let m = this.result;

            m.headers = {};
            m.httpVersion = "1.0";
            m.socket = {};
        })
        .expectingPropertyToBe ("result.host", "")
        .commit ()

    .should ("provide the parsed URL")
        .after (function ()
        {
            let m = this.result;

            m.url = "/users/123?a=b";
            m.headers = {};
            m.httpVersion = "1.0";
            m.socket = {};
        })
        .expectingPropertyToBeOfType ("result.parsedUrl", "Url")
        .expectingPropertyToBe ("result.path", "/users/123?a=b")
        .expectingPropertyToBe ("result.pathname", "/users/123")
        .expectingPropertyToBe ("result.query", { a: "b" })
        .commit ()

    .should ("update the parsed URL if the url property has been changed")
        .after (function ()
        {
            let m = this.result;

            m.url = "/";
            m.headers = {};
            m.httpVersion = "1.0";
            m.socket = {};

            this.path1 = m.path;
            this.pathname1 = m.pathname;

            m.url = "/a/b/?c=d";

            this.path2 = m.path;
            this.pathname2 = m.pathname;
            this.query2 = m.query;
        })
        .expectingPropertyToBeOfType ("result.parsedUrl", "Url")
        .expectingPropertyToBe ("path1", "/")
        .expectingPropertyToBe ("pathname1", "/")
        .expectingPropertyToBe ("path2", "/a/b/?c=d")
        .expectingPropertyToBe ("pathname2", "/a/b")
        .expectingPropertyToBe ("query2", { c: "d" })
        .commit ()
;


let dir = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");


test.method (http, "createSecureContext", true)
    .should ("create a secure context")
        .given (dir.join ("pushcorn.com.crt"), dir.join ("pushcorn.com.key"), dir.join ("ca.pushcorn.com.crt"))
        .returnsInstanceOf (require ("tls").SecureContext)
        .commit ()
;


test.method (http, "responseFor", true)
    .should ("return a response instance for the given status code")
        .given (200)
        .returnsInstanceOf (http.Response)
        .commit ()

    .given (204)
        .returnsInstanceOf ("http.responses.NoContent")
        .commit ()

    .given (999)
        .returnsInstanceOf ("http.responses.InternalServerError")
        .commit ()
;


test.object ("http.ClientRequestOptions")
    .should ("represent the options of a client request")
        .given ("http://pushcorn.com/ab")
        .returnsInstanceOf ("http.ClientRequestOptions")
        .expectingPropertyToBe ("result.path", "/ab")
        .expectingPropertyToBe ("result.port", undefined)
        .commit ()

    .given ("http://pushcorn.com/ab", { body: "ABCD" })
        .returnsInstanceOf ("http.ClientRequestOptions")
        .expectingPropertyToBe ("result.path", "/ab")
        .expectingPropertyToBe ("result.headers.Content-Length", 4)
        .commit ()

    .given ("http://pushcorn.com/ab", { body: { a: 3 } })
        .returnsInstanceOf ("http.ClientRequestOptions")
        .expectingPropertyToBe ("result.path", "/ab")
        .expectingPropertyToBe ("result.headers.Content-Length", 7)
        .expectingPropertyToBe ("result.headers.Content-Type", "application/json")
        .commit ()

    .given (new URL ("http://pushcorn.com:8080/ab"))
        .returnsInstanceOf ("http.ClientRequestOptions")
        .expectingPropertyToBe ("result.path", "/ab")
        .expectingPropertyToBe ("result.port", 8080)
        .commit ()

    .given ()
        .returnsInstanceOf ("http.ClientRequestOptions")
        .expectingPropertyToBe ("result.path", "/")
        .expectingPropertyToBe ("result.port", undefined)
        .commit ()
;


test.method (http, "fetch", true)
    .should ("make an HTTP request to the server")
        .up (() =>
        {
            http.defineService ("test.services.Hello")
                .onDispatch (ctx =>
                {
                    ctx.send ("http:text", "Hello!");
                })
            ;
        })
        .useServer ({ services: "test:hello" })
        .before (s => s.args = s.baseUrl)
        .returnsInstanceOf ("http.IncomingMessage")
        .commit ()

    .should ("throw on request error")
        .up (() =>
        {
            http.defineService ("test.services.HelloError")
                .onDispatch (ctx =>
                {
                    ctx.res.destroy (new Error ("ERR"));
                })
            ;
        })
        .useServer ({ services: "test:hello-error" })
        .before (s => s.args = s.baseUrl)
        .throws (/socket hang up/)
        .expectingPropertyToBe ("result.statusCode", undefined)
        .commit ()
;


test.method (http, "fetchText", true)
    .should ("fetch text content from the server")
        .up (() =>
        {
            http.defineService ("test.services.Hello")
                .onDispatch (ctx =>
                {
                    ctx.send ("http:text", "Hello!");
                })
            ;
        })
        .useServer ({ services: "test:hello" })
        .before (s => s.args = s.baseUrl)
        .returns ("Hello!")
        .commit ()

    .should ("be able to make an HTTPS request")
        .up (() =>
        {
            http.defineService ("test.services.Hello")
                .onDispatch (ctx =>
                {
                    ctx.send ("http:text", "Hello!");
                })
            ;
        })
        .useServer (
        {
            names: "app.pushcorn.com",
            services: "test:hello",
            certificate:
            {
                cert: CERTS_DIR.join ("pushcorn.com.crt"),
                key: CERTS_DIR.join ("pushcorn.com.key")
            }
        })
        .before (s => s.args =
        [
            s.baseUrl,
            {
                rejectUnauthorized: false,
                headers:
                {
                    "host": `app.pushcorn.com:${s.server.realPort}`
                }
            }
        ])
        .returns ("Hello!")
        .commit ()
;


test.method (http, "fetchData", true)
    .should ("fetch binary content from the server")
        .up (() =>
        {
            http.defineService ("test.services.Hello")
                .onDispatch (ctx =>
                {
                    ctx.send ("http:file", CERTS_DIR.join ("pushcorn.com.crt"));
                })
            ;
        })
        .useServer ({ services: "test:hello" })
        .before (s => s.args = s.baseUrl)
        .returnsInstanceOf (Buffer)
        .expectingMethodToReturnValue ("result.toString", "utf8", /^-+BEGIN CERT/)
        .commit ()
;


test.method (http, "fetchJson", true)
    .should ("fetch JSON content from the server")
        .up (() =>
        {
            http.defineService ("test.services.Hello")
                .onDispatch (ctx =>
                {
                    ctx.sendJson (
                    {
                        message: "Hello!"
                    });
                })
            ;
        })
        .useServer ({ services: "test:hello" })
        .before (s => s.args = s.baseUrl)
        .returns ({ message: "Hello!" })
        .commit ()

    .should ("return an empty object if the response is empty")
        .up (() =>
        {
            http.defineService ("test.services.HelloEmpty")
                .onDispatch (ctx =>
                {
                    ctx.sendJson ();
                })
            ;
        })
        .useServer ({ services: "test:hello-empty" })
        .before (s => s.args = s.baseUrl)
        .returns ()
        .commit ()

    .should ("handle the post request")
        .up (() =>
        {
            http.defineService ("test.services.Ping")
                .condition ("http:request-path", "/ping")
                .onDispatch (ctx =>
                {
                    if (ctx.requestBody?.message == "ping")
                    {
                        ctx.sendJson (
                        {
                            message: "pong"
                        });
                    }
                })
            ;
        })
        .useServer ({ services: "test:ping" })
        .before (s => s.args =
        [
            s.baseUrl + "/ping",
            {
                method: "POST",
                body: { message: "ping" },
                headers:
                {
                    "content-type": "application/json"
                }
            }
        ])
        .returns ({ message: "pong" })
        .commit ()

    .should ("handle the redirect")
        .up (s =>
        {
            http.defineService ("test.services.Redir")
                .condition ("http:request-path", "/redir")
                .onDispatch (ctx =>
                {
                    ctx.redirect (308, { pathname: "/ping" });
                })
            ;

            http.defineService ("test.services.Ping")
                .condition ("http:request-path", "/ping")
                .onDispatch (ctx =>
                {
                    if (ctx.requestBody?.message == "ping")
                    {
                        ctx.sendJson (
                        {
                            message: "pong",
                            name: ctx.queryParams.name
                        });
                    }
                })
            ;

            s.server = nit.new ("http.Server",
            {
                port: 0,
                stopTimeout: 0,
                services: ["@test.services.Redir", "@test.services.Ping"]
            });
        })
        .useServer ({ services: ["test:redir", "test:ping"] })
        .before (s => s.args =
        [
            `${s.baseUrl}/redir?name=test`,
            {
                method: "POST",
                body: { message: "ping" },
                headers:
                {
                    "content-type": "application/json"
                }
            }
        ])
        .returns ({ message: "pong", name: "test" })
        .commit ()

    .should ("handle the HTTPS redirect")
        .up (() =>
        {
            http.defineService ("test.services.Redir")
                .condition ("http:request-path", "/redir")
                .onDispatch (ctx =>
                {
                    ctx.redirect (302, { host: "", hostname: "127.0.0.1", pathname: "/ping" });
                })
            ;

            http.defineService ("test.services.Ping")
                .condition ("http:request-path", "/ping")
                .onDispatch (ctx =>
                {
                    if (ctx.requestBody?.message == "ping")
                    {
                        ctx.sendJson (
                        {
                            message: "pong",
                            name: ctx.queryParams.name
                        });
                    }
                })
            ;
        })
        .useServer (
        {
            services: ["test:redir", "test:ping"],
            names: "app.pushcorn.com",
            certificate:
            {
                cert: CERTS_DIR.join ("pushcorn.com.crt"),
                key: CERTS_DIR.join ("pushcorn.com.key")
            }
        })
        .before (s => s.args =
        [
            `${s.baseUrl}/redir?name=test2`,
            {
                method: "POST",
                body: { message: "ping" },
                rejectUnauthorized: false,
                headers:
                {
                    "content-type": "application/json",
                    "host": `app.pushcorn.com:${s.server.realPort}`
                }
            }
        ])
        .returns ({ message: "pong", name: "test2" })
        .commit ()
;
