test.method ("http.ApiClient", "buildFromUrl", true)
    .should ("import the spec from an URL")
        .project ("myapp", true)
        .useServer (
        {
            services:
            {
                "@name": "http:api-server",
                "includes": ["myapp.*", "http.*"]
            }
        })
        .mockXhrSend ()
        .up (s => s.class = s.http.defineApiClient ("MyClient"))
        .before (s => s.args = s.baseUrl)
        .after (async (s) =>
        {
            let client = s.client = new s.class;

            s.helloResult = await client.myapp.hello ("John Doe", { opt3: "user@p.com" });
        })
        .returnsInstanceOf (Function)
        .expecting ("5 APIs were defined", 5, s => nit.keys (s.client.http).length + nit.keys (s.client.myapp).length)
        .expectingPropertyToBe ("result.myapp.apis.CheckIn",
        {
            "name": "MyClient.myapp.apis.CheckIn",
            "description": "Check-in your location.",
            "requestMethod": "POST",
            "requestPath": "/check-ins"

        }, true)
        .expectingMethodToReturnValue ("helloResult.response.toPojo", null, { message: "Hello John Doe!" })
        .expectingPropertyToBe ("helloResult.ok", true)
        .expectingMethodToReturnValueContaining ("helloResult.res.toPojo", null,
        {
            status: 200,
            type: "application/json",
            headers:
            {
                "Content-Length": "29"
            }
        })
        .expectingMethodToReturnValueContaining ("helloResult.req.toPojo", null,
        {
            method: "GET",
            timeout: 0
        })
        .commit ()
;


test.method ("http.ApiClient", "build", true)
    .should ("import the given spec")
        .project ("myapp", true)
        .useServer (
        {
            services:
            {
                "@name": "http:api-server",
                "includes": ["myapp.*", "http.*"]
            }
        })
        .mockXhrSend ()
        .up (s => s.class = s.http.defineApiClient ("MyApp2"))
        .before (async (s) =>
        {
            let response = await s.Xhr.send (s.baseUrl);
            let spec = response.result.spec;

            s.class.url = s.baseUrl;
            spec.apis[4].request.parameters[3].constraints[0].type = "test:unique"; // simulate the server-side constraint to be created by the client
            spec.apis[4].request.parameters[4].constraints[0].type = "email";

            s.args = spec;
        })
        .after (async (s) =>
        {
            let client = s.client = new s.class;

            s.helloResult = await client.myapp.hello ("Jane Doe", { opt2: "unique value" });
            s.checkInResult = await client.myapp.checkIn ("56AB", { location: { latitude: 3.3, longitude: 4.4 } });

            const Context = s.class.myapp.apis.GetBlob.Context;
            let content = Buffer.from ("TEST_STR").toString ("base64");

            s.getBlobResult = await client.myapp.getBlob (Context.new ({ request: content }));
        })
        .returnsResultOfExpr ("class")
        .expecting ("5 APIs were defined", 5, s => nit.keys (s.client.http).length + nit.keys (s.client.myapp).length)
        .expectingPropertyToBe ("result.myapp.apis.CheckIn",
        {
            "name": "MyApp2.myapp.apis.CheckIn",
            "description": "Check-in your location.",
            "requestMethod": "POST",
            "requestPath": "/check-ins"

        }, true)
        .expectingMethodToReturnValue ("helloResult.response.toPojo", null, { message: "Hello Jane Doe!" })
        .expectingMethodToReturnValue ("checkInResult.response.toPojo", null, {})
        .expectingPropertyToBe ("checkInResult.response.constructor.name", "MyApp2.myapp.responses.CheckInRecorded")
        .commit ()
;


test.method ("http.ApiClient.Api", "send")
    .should ("convert the error to a response")
        .project ("myapp", true)
        .useServer (
        {
            services:
            {
                "@name": "http:api-server",
                "includes": ["myapp.*", "http.*"]
            }
        })
        .mockXhrSend ()
        .before (async (s) =>
        {
            let clientClass = await s.http.defineApiClient ("MyApp").buildFromUrl (s.baseUrl);

            s.class = clientClass.myapp.apis.Hello;
            s.object = new s.class;

            delete clientClass.http.responses.ValidationFailed;
        })
        .expectingPropertyToBeOfType ("result.response", "http.ApiClient.UnexpectedErrorOccurred")
        .expectingPropertyToBe ("result.response.error.code", "error.model_validation_failed")
        .commit ()

    .should ("append the query string to path")
        .up (s => s.Client = s.http.defineApiClient ("MyClient")
            .build (
            {
                apis:
                [
                {
                    name: "MyApi",
                    requestMethod: "GET",
                    requestPath: "/answers",
                    request:
                    {
                        parameters:
                        [
                        {
                            spec: "a",
                            type: "string",
                            source: "query"
                        }
                        ,
                        {
                            spec: "b",
                            type: "string",
                            source: "query"
                        }
                        ]
                    }
                }
                ]
            })
        )
        .up (s => s.class = s.Client.MyApi)
        .mock ("Xhr", "send")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "/answers?a=&b=")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.1", "GET")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.2",
        {
            headers: undefined,
            data: undefined
        })
        .commit ()

    .should ("append to the existing the query string")
        .up (s => s.Client = s.http.defineApiClient ("MyClient")
            .build (
            {
                apis:
                [
                {
                    name: "MyApi",
                    requestMethod: "GET",
                    requestPath: "/answers?c=d",
                    request:
                    {
                        parameters:
                        [
                        {
                            spec: "a",
                            type: "string",
                            source: "query"
                        }
                        ,
                        {
                            spec: "b",
                            type: "string",
                            source: "query"
                        }
                        ]
                    }
                }
                ]
            })
        )
        .up (s => s.class = s.Client.MyApi)
        .mock ("Xhr", "send")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "/answers?c=d&a=&b=")
        .commit ()

    .should ("set the cookie parameters")
        .up (s => s.Client = s.http.defineApiClient ("MyClient")
            .build (
            {
                apis:
                [
                {
                    name: "MyApi",
                    requestMethod: "GET",
                    requestPath: "/answers?c=d",
                    request:
                    {
                        parameters:
                        [
                        {
                            spec: "a",
                            type: "string",
                            source: "cookie"
                        }
                        ]
                    }
                }
                ]
            })
        )
        .up (s => s.class = s.Client.MyApi)
        .given ({ a: "cookie token" })
        .mock ("Xhr", "send")
        .mock ("Cookies", "set")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "/answers?c=d")
        .expectingPropertyToBe ("mocks.1.invocations.0.args", ["a", "cookie token"])
        .commit ()

    .should ("throw if the response name is invalid")
        .up (s => s.Client = s.http.defineApiClient ("MyClient")
            .build (
            {
                apis:
                [
                {
                    name: "MyApi",
                    requestMethod: "GET",
                    requestPath: "/test"
                }
                ]
            })
        )
        .up (s => s.class = s.Client.MyApi)
        .mock ("Xhr", "send", function ()
        {
            return this.strategy.Xhr.Response (
            {
                headers:
                {
                    "X-Response-Name": "InvalidResp"
                }
            });
        })
        .expectingPropertyToBeOfType ("result.response", "http.ApiClient.UnexpectedErrorOccurred")
        .expectingPropertyToBe ("result.response.error.code", "error.invalid_response_name")
        .commit ()

    .should ("convert unknown error to UnexpectedErrorOccurred")
        .up (s => s.Client = s.http.defineApiClient ("MyClient")
            .build (
            {
                apis:
                [
                {
                    name: "MyApi",
                    requestMethod: "GET",
                    requestPath: "/test"
                }
                ]
            })
        )
        .up (s => s.class = s.Client.MyApi)
        .mock ("Xhr", "send", function ()
        {
            throw new Error ("XHR_ERR");
        })
        .expectingPropertyToBeOfType ("result.response", "http.ApiClient.UnexpectedErrorOccurred")
        .expectingPropertyToBe ("result.response.error.code", "error.unexpected_error")
        .expectingPropertyToBe ("result.response.error.message", "XHR_ERR")
        .commit ()

    .should ("use the response type that matches the error code when possible")
        .up (s => s.Client = s.http.defineApiClient ("MyClient")
            .build (
            {
                apis:
                [
                {
                    name: "MyApi",
                    method: "POST",
                    path: "/users",
                    request:
                    {
                        parameters:
                        [
                        {
                            spec: "<name>",
                            type: "string",
                            source: "form"
                        }
                        ]
                    }
                }
                ]
                ,
                responses:
                [
                {
                    name: "ValidationFailed",
                    code: "error.model_validation_failed",
                    message: "params invalid",
                    fields:
                    [
                    {
                        spec: "violations...",
                        type: "object"
                    }
                    ]
                }
                ]
            })
        )
        .up (s => s.class = s.Client.MyApi)
        .expectingPropertyToBeOfType ("result.response", "MyClient.ValidationFailed")
        .expectingPropertyToBe ("result.response.violations.0",
        {
            code: "error.value_required",
            constraint: "",
            field: "name",
            message: "The parameter 'name' is required."
        })
        .commit ()
;
