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
        .expectingPropertyToBe ("result.ip", "127.0.0.1")
        .expectingPropertyToBe ("result.realIp", "127.0.0.1")
        .expectingPropertyToBe ("result.userAgent", "nit")
        .expectingPropertyToBe ("result.contentType", "application/json")
        .commit ()

    .should ("use return the value of x-forwarded-for for realIp if available")
        .after (function ()
        {
            let m = this.result;

            m.headers = { host: "localhost", "x-forwarded-for": "1.2.3.4" };
            m.socket = { remoteAddress: "127.0.0.1" };
        })
        .expectingPropertyToBe ("result.realIp", "1.2.3.4")
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
            m.socket = { remoteAddress: "127.0.0.1" };
        })
        .expectingPropertyToBe ("result.hostname", "127.0.0.1")
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
;
