nit.ns.export ();


test.method ("http.ApiClient", "importFromUrl", true)
    .should ("import the spec from an URL")
    .project ("myapp")
    .useServer (
    {
        services:
        [
        {
            name: "http:api-server",
            options:
            {
                includes: ["myapp.*", "http.*"]
            }
        }
        ]
    })
    .mockXhrSend ()
    .before (async (s) =>
    {
        s.object = await s.http.defineApiClient ("MyApp");
        s.args = s.baseUrl;
    })
    .after (async (s) =>
    {
        s.helloResult = await s.result.shared.hello ("John Doe", { opt3: "user@p.com" });
    })
    .returnsInstanceOf (Function)
    .expecting ("4 APIs were defined", 4, s => nit.keys (s.result.apis).length)
    .expectingPropertyToBe ("result.apis.CheckIn",
    {
        "description": "Check-in your location.",
        "method": "POST",
        "name": "http.apiclients.MyApp.apis.CheckIn",
        "path": "/check-ins"

    }, true)
    .expectingMethodToReturnValue ("helloResult.toPojo", null, { message: "Hello John Doe!" })
    .commit ()
;


test.method ("http.ApiClient", "import", true)
    .should ("import the given spec")
    .project ("myapp")
    .useServer (
    {
        services:
        [
        {
            name: "http:api-server",
            options:
            {
                includes: ["myapp.*", "http.*"]
            }
        }
        ]
    })
    .mockXhrSend ()
    .before (async (s) =>
    {
        let response = await s.Xhr.send (s.baseUrl);
        let result = response.result;

        s.object = await s.http.defineApiClient ("MyApp2")
            .meta ("baseUrl", s.baseUrl)
        ;

        result.spec.apis[3].request.parameters[3].constraints[0].type = "test:unique"; // simulate the server-side constraint to be created by the client
        result.spec.apis[3].request.parameters[4].constraints[0].type = "email";

        s.args = nit.new ("http.ApiSpec", result.spec);
    })
    .after (async (s) =>
    {
        s.helloResult = await s.result.shared.hello ("Jane Doe", { opt2: "unique value" });
    })
    .returnsInstanceOf (Function)
    .expecting ("4 APIs were defined", 4, s => nit.keys (s.result.apis).length)
    .expectingPropertyToBe ("result.apis.CheckIn",
    {
        "description": "Check-in your location.",
        "method": "POST",
        "name": "http.apiclients.MyApp2.apis.CheckIn",
        "path": "/check-ins"

    }, true)
    .expectingMethodToReturnValue ("helloResult.toPojo", null, { message: "Hello Jane Doe!" })
    .commit ()
;


test.method ("http.ApiClient.Model", "import", true)
    .should ("import the model spec")
    .before (s =>
    {
        s.object = s.class.defineSubclass ("TestModel");
        s.args =
        {
            fields:
            [
                s.ApiSpec.Field ("<type>", "string",
                {
                    constraints: s.ApiSpec.Constraint ("choice", { options: { choices: ["a", "b"] } })
                })
            ]
        };
    })
    .expectingPropertyToBe ("result.fieldMap.type.constraints.length", 1)
    .expectingPropertyToBe ("result.fieldMap.type.constraints.0.choices", ["a", "b"])
    .commit ()
;


test.method ("http.ApiClient.Api", "send", true)
    .should ("convert the error to a response")
        .project ("myapp")
        .useServer ({ services: ["http:api-server"] })
        .mockXhrSend ()
        .before (async (s) =>
        {
            let client = await s.http.defineApiClient ("MyApp").importFromUrl (s.baseUrl);

            s.object = client.apis.Hello;

            delete client.responses.ValidationFailed;
        })
        .returnsInstanceOf ("http.ApiClient.UnexpectedErrorOccurred")
        .expectingPropertyToBe ("result.error.code", "error.model_validation_failed")
        .commit ()

    .should ("append the query string to path")
        .before (s =>
        {
            s.object = s.class.defineSubclass ("MyApi")
                .import (s.ApiSpec.Api (
                {
                    name: "MyApi",
                    method: "GET",
                    path: "/answers",
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
                }))
            ;
        })
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
        .before (s =>
        {
            s.object = s.class.defineSubclass ("MyApi")
                .import (s.ApiSpec.Api (
                {
                    name: "MyApi",
                    method: "GET",
                    path: "/answers?c=d",
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
                }))
            ;
        })
        .mock ("Xhr", "send")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "/answers?c=d&a=&b=")
        .commit ()

    .should ("set the cookie parameters")
        .before (s =>
        {
            s.object = s.class.defineSubclass ("MyApi")
                .import (s.ApiSpec.Api (
                {
                    name: "MyApi",
                    method: "GET",
                    path: "/answers?c=d",
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
                }))
            ;
        })
        .given ({ a: "cookie token" })
        .mock ("Xhr", "send")
        .mock ("Cookies", "set")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "/answers?c=d")
        .expectingPropertyToBe ("mocks.1.invocations.0.args", ["a", "cookie token"])
        .commit ()

    .should ("throw if the response name is invalid")
        .before (s =>
        {
            s.object = s.class.defineSubclass ("MyApi")
                .import (s.ApiSpec.Api (
                {
                    name: "MyApi",
                    method: "GET",
                    path: "/test"
                }))
            ;
        })
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
        .expectingPropertyToBeOfType ("result", "http.ApiClient.UnexpectedErrorOccurred")
        .expectingPropertyToBe ("result.error.code", "error.invalid_response_name")
        .commit ()

    .should ("use the response type that matches the error code when possible")
        .before (s =>
        {
            let clientClass = s.class.outerClass.defineSubclass ("MyClient");

            clientClass
                .import (s.ApiSpec (
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
                }))
            ;

            s.object = clientClass.apis.MyApi;
        })
        .expectingPropertyToBeOfType ("result", "MyClient.responses.ValidationFailed")
        .expectingPropertyToBe ("result.violations.0",
        {
            code: "error.value_required",
            constraint: "",
            field: "name",
            message: "The parameter 'name' is required."
        })
        .commit ()
;
