const XmlHttpRequest = nit.require ("http.mocks.XmlHttpRequest");


test.object ("http.Xhr.Request")
    .should ("represent an XHR request")
    .given ("/users/1234", "POST", { data: { a: 1 } })
    .returnsInstanceOf ("http.Xhr.Request")
    .expectingMethodToReturnValue ("result.toPojo", null,
    {
        url: "/users/1234",
        method: "POST",
        data: { a: 1 },
        timeout: 0,
        headers: {}
    })
    .commit ()
;


test.method ("http.Xhr.Response", "fromXhr", true)
    .should ("build a response from XHR")
        .given (
        {
            status: 200,
            getAllResponseHeaders: function ()
            {
                return nit.trim.text`
                    date: Fri, 08 Dec 2017 21:04:30 GMT\r\n
                    content-encoding: gzip\r\n
                    x-content-type-options: nosniff\r\n
                    x-frame-options: DENY\r\n
                    content-type: text/html; charset=utf-8\r\n
                `;
            }
        })
        .returnsInstanceOf ("http.Xhr.Response")
        .expectingPropertyToBe ("result.ok", true)
        .expectingPropertyToBe ("result.headers",
        {
            "Date": "Fri, 08 Dec 2017 21:04:30 GMT",
            "Content-Encoding": "gzip",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Content-Type": "text/html; charset=utf-8"
        })
        .commit ()

    .should ("parse the JSON result")
        .given (
        {
            status: 201,
            getAllResponseHeaders: function ()
            {
                return nit.trim.text`
                    date: Fri, 08 Dec 2017 21:04:30 GMT\r\n
                    content-encoding: gzip\r\n
                    content-type: application/json; charset=utf-8\r\n
                `;
            }
            ,
            responseText: nit.toJson ({ a: 1, b: 2 })
        })
        .returnsInstanceOf ("http.Xhr.Response")
        .expectingPropertyToBe ("result.ok", true)
        .expectingPropertyToBe ("result.headers",
        {
            "Date": "Fri, 08 Dec 2017 21:04:30 GMT",
            "Content-Encoding": "gzip",
            "Content-Type": "application/json; charset=utf-8"
        })
        .expectingPropertyToBe ("result.result", { a: 1, b: 2 })
        .commit ()

    .should ("log the JSON parsing error")
        .given (
        {
            status: 201,
            getAllResponseHeaders: function ()
            {
                return nit.trim.text`
                    date: Fri, 08 Dec 2017 21:04:30 GMT\r\n
                    content-encoding: gzip\r\n
                    content-type: application/json; charset=utf-8\r\n
                `;
            }
            ,
            responseText: "NOT JSON"
        })
        .mock (nit, "debug")
        .returnsInstanceOf ("http.Xhr.Response")
        .expectingPropertyToBe ("result.ok", true)
        .expectingPropertyToBe ("result.headers",
        {
            "Date": "Fri, 08 Dec 2017 21:04:30 GMT",
            "Content-Encoding": "gzip",
            "Content-Type": "application/json; charset=utf-8"
        })
        .expectingPropertyToBe ("result.result", undefined)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "http.Xhr")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.1", /SyntaxError/)
        .commit ()

    .should ("just use the XHR response as the result if content-type header was not specified")
        .given (
        {
            status: 200,
            getAllResponseHeaders: function ()
            {
                return nit.trim.text`
                    date: Fri, 08 Dec 2017 21:04:30 GMT\r\n
                    content-encoding: gzip\r\n
                `;
            }
            ,
            response: { a: 1 }
        })
        .returnsInstanceOf ("http.Xhr.Response")
        .expectingPropertyToBe ("result.result", { a: 1 })
        .commit ()

;


test.object ("http.Xhr")
    .should ("initialize the properties with the given request object")
    .given (
    {
        request:
        {
            url: "http://a.b.com",
            timeout: 10000
        }
    })
    .expectingPropertyToBeOfType ("result.xhr", "http.mocks.XmlHttpRequest")
    .expectingPropertyToBe ("result.xhr.timeout", 10000)
    .commit ()
;


test.method ("http.Xhr", "send")
    .should ("send the requeset to the server")
        .up (s =>
        {
            s.createArgs =
            {
                request:
                {
                    url: "http://a.b.com",
                    headers:
                    {
                        "auth-token": 1234
                    }
                }
            };
        })
        .expectingMethodToReturnValue ("result.toPojo", null,
        {
            headers: {},
            result: undefined,
            status: 0,
            statusText: "",
            type: ""
        })
        .commit ()

    .should ("throw if the request has been aborted")
        .up (s =>
        {
            s.createArgs =
            {
                request:
                {
                    url: "http://a.b.com",
                    headers:
                    {
                        "auth-token": 1234
                    }
                }
            };
        })
        .mock (XmlHttpRequest, XmlHttpRequest.kSend, function ()
        {
            this.obj.onabort ();
        })
        .throws ("error.xhr_abort")
        .commit ()

    .should ("throw if the request has timed out")
        .up (s =>
        {
            s.createArgs =
            {
                request: { url: "http://a.b.com" }
            };
        })
        .mock (XmlHttpRequest, XmlHttpRequest.kSend, function ()
        {
            this.obj.ontimeout ();
        })
        .throws ("error.xhr_timeout")
        .commit ()

    .should ("throw if the request has encountered an error")
        .up (s =>
        {
            s.createArgs =
            {
                request: { url: "http://a.b.com" }
            };
        })
        .mock (XmlHttpRequest, XmlHttpRequest.kSend, function ()
        {
            this.obj.onerror ();
        })
        .throws ("error.xhr_error")
        .commit ()

    .should ("not send the request more than once")
        .up (s =>
        {
            s.createArgs =
            {
                request: { url: "http://a.b.com" }
            };
        })
        .mock (XmlHttpRequest, XmlHttpRequest.kSend, function ()
        {
            this.obj.onload ();
        })
        .returnsInstanceOf ("http.Xhr.Response")
        .after (s => s.object.send ())
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("serialize the POST data to JSON if the content-type header is not set")
        .up (s =>
        {
            s.createArgs =
            {
                request:
                {
                    url: "http://a.b.com?c=2",
                    method: "POST",
                    data: { a: 1 }
                }
            };
        })
        .before (s => s.object.xhr.onsend = () => s.object.xhr.onload ())
        .returnsInstanceOf ("http.Xhr.Response")
        .expectingPropertyToBe ("object.xhr.data", nit.toJson ({ a: 1 }))
        .expectingPropertyToBe ("object.xhr.url", "http://a.b.com?c=2")
        .commit ()

    .should ("serialize the GET data to a query")
        .up (s =>
        {
            s.createArgs =
            {
                request:
                {
                    url: "http://a.b.com",
                    data: { a: 1 }
                }
            };
        })
        .before (s => s.object.xhr.onsend = () => s.object.xhr.onload ())
        .expectingPropertyToBe ("object.xhr.url", "http://a.b.com?a=1")
        .expectingPropertyToBe ("object.xhr.data", undefined)
        .commit ()

    .should ("append the GET data to the existing query")
        .up (s =>
        {
            s.createArgs =
            {
                request:
                {
                    url: "http://a.b.com?c=2",
                    data: { a: 1 }
                }
            };
        })
        .before (s => s.object.xhr.onsend = () => s.object.xhr.onload ())
        .expectingPropertyToBe ("object.xhr.url", "http://a.b.com?c=2&a=1")
        .expectingPropertyToBe ("object.xhr.data", undefined)
        .commit ()

    .should ("keep the data as is if the content-type header is set")
        .up (s =>
        {
            s.createArgs =
            {
                request:
                {
                    url: "http://a.b.com",
                    data: "a string data",
                    method: "POST",
                    headers:
                    {
                        "Content-Type": "text/plain"
                    }
                }
            };
        })
        .before (s => s.object.xhr.onsend = () => s.object.xhr.onload ())
        .expectingPropertyToBe ("object.xhr.url", "http://a.b.com")
        .expectingPropertyToBe ("object.xhr.data", "a string data")
        .commit ()
;


test.method ("http.Xhr", "send", true)
    .should ("send the request to the given URL")
    .given ("http://a.b.com")
    .expectingMethodToReturnValue ("result.toPojo", null,
    {
        headers: {},
        result: undefined,
        status: 0,
        statusText: "",
        type: ""
    })
    .commit ()
;


test.method ("http.Xhr", "post", true)
    .should ("send the request using POST")
    .given ("http://a.b.com", { data: { a: 1 } })
    .expectingPropertyToBe ("result.request.xhr.xhr.data", `{"a":1}`)
    .commit ()
;
