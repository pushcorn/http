const Context = nit.require ("http.Context");


test.method ("http.Api.Context", "respond")
    .should ("throw if the argument is not a response and the API does not define any response")
        .up (s => s.class = s.http.Api.defineSubclass ("MyApi").Context)
        .up (s => s.createArgs = Context.new ("GET", "/"))
        .given ("the data")
        .throws ("error.no_default_response")
        .commit ()

    .should ("create the response if the first argument is not an instance of response")
        .up (s => s.class = s.http.Api.defineSubclass ("MyApi").Context)
        .up (s => s.createArgs = Context.new ("GET", "/"))
        .before (s => s.class.outerClass.response ("http:text"))
        .given ("the data")
        .expectingPropertyToBeOfType ("result.response", "http.responses.Text")
        .expectingPropertyToBe ("result.response.text", "the data")
        .commit ()

    .should ("just send the response if it is an instance of response")
        .up (s => s.class = s.http.Api.defineSubclass ("MyApi").Context)
        .up (s => s.createArgs = Context.new ("GET", "/"))
        .given (nit.new ("http.responses.RequestFailed", "error!"))
        .expectingPropertyToBeOfType ("result.response", "http.responses.RequestFailed")
        .expectingPropertyToBe ("result.response.data", "error!")
        .commit ()
;


test.method ("http.Api", "describe", true)
    .should ("set the description meta data")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .given ("find users")
        .expectingPropertyToBe ("class.description", "find users")
        .commit ()
;


test.method ("http.Api", "postNsInvoke", true)
    .should ("skip if the request has no parameters")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .expectingPropertyToBe ("class.responses.length", 0)
        .commit ()

    .should ("add ValidationFailed response to the response list if the request has at least one parameter")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .before (s =>
        {
            s.class.defineRequest (Request =>
            {
                Request.parameter ("name", "string");
            });
        })
        .expectingPropertyToBe ("class.responses.length", 1)
        .expectingPropertyToBe ("class.responses.0.name", "http.responses.ValidationFailed")
        .commit ()

    .should ("skip if the ValidationFailed response has been added")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .before (s =>
        {
            s.class.defineRequest (Request =>
            {
                Request.parameter ("name", "string");
            });

            s.class.response ("http.responses.ValidationFailed");
        })
        .expectingPropertyToBe ("class.responses.length", 1)
        .expectingPropertyToBe ("class.responses.0.name", "http.responses.ValidationFailed")
        .commit ()
;


test.method ("http.Api", "run")
    .should ("throw if the returned response was not in the list of allowed responses")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .given (Context.new ("GET", "/"))
        .before (s =>
        {
            s.class.response ("http:file");
            s.args[0].noop ();
        })
        .throws ("error.response_not_allowed")
        .commit ()

    .should ("only check the valid response type if ctx.response is set")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .given (Context.new ("GET", "/"))
        .before (s =>
        {
            s.class
                .response ("http:file")
                .onRun (function ()
                {
                    throw new Error ("EXCEPTION");
                })
            ;
        })
        .throws ("EXCEPTION")
        .commit ()
;


test.method ("http.Api", "run")
    .should ("skip if the allowed response was not specified")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .given (Context.new ("GET", "/"))
        .before (s =>
        {
            s.args[0].noop ();
        })
        .returnsResultOfExpr ("args.0")
        .commit ()
;


test.method ("http.Api", "run")
    .should ("not send hook result if no response was specified")
        .up (s => s.class = s.class.defineSubclass ("MyApi")
            .onRun (() => nit.o ({ a: 1 }))
        )
        .given (Context.new ("GET", "/"))
        .expectingPropertyToBe ("args.0.response")
        .commit ()

    .should ("set the response if the hook returns a value")
        .up (s => s.class = s.class.defineSubclass ("MyApi")
            .response ("http:json")
            .onRun (() => nit.o ({ a: 1 }))
        )
        .given (Context.new ("GET", "/"))
        .expectingPropertyToBe ("args.0.response",
        {
            contentType: "application/json",
            json: { a: 1 }
        })
        .commit ()
;


test.method ("http.Api", "catch")
    .should ("send the ValidationFailed response if the error code is error.model_validation_failed")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .given (Context.new ("GET", "/"))
        .before (s =>
        {
            const A = nit.defineClass ("A", "http.Request")
                .parameter ("<name>", "string")
            ;

            try
            {
                A.validate (new A);
            }
            catch (e)
            {
                s.args[0].error = e;
            }
        })
        .expectingPropertyToBeOfType ("args.0.response", "http.responses.ValidationFailed")
        .expectingPropertyToBe ("args.0.error", undefined)
        .commit ()

    .should ("skip if the error code is not error.model_validation_failed")
        .given (Context.new ("GET", "/", null, { error: nit.assign (new Error ("ERR"), { code: "error.invalid_value" }) }))
        .throws ("error.invalid_value")
        .commit ()

    .should ("cast the error to the response of with same error code")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .up (s => s.class.defineResponse ("InvalidValue", InvalidValue =>
        {
            InvalidValue.meta ("code", "error.invalid_value");
        }))
        .given (Context.new ("GET", "/", null, { error: nit.assign (new Error ("ERR"), { code: "error.invalid_value" }) }))
        .returns ()
        .expectingPropertyToBeOfType ("args.0.response", "MyApi.InvalidValue")
        .commit ()
;


test.compgenCompleter ("http.Api.compgencompleters.Completer")
    .should ("generate the available API names")
        .project ("myapp", true)
        .given ({ completionType: "type" })
        .before (s => s.context.currentOption =
        {
            spec: "<api>",
            type: "api"
        })
        .returns (["VALUE", "myapp:auto-path", "myapp:check-in", "myapp:get-blob", "myapp:hello", "http:get-api-spec"])
        .commit ()
;


test.method ("http.Api", "defineResponse", true)
    .should ("define an inner response")
        .up (s => s.class = s.class.defineSubclass ("MyApi"))
        .given ("DataReturned")
        .expectingPropertyToBeOfType ("class.DataReturned", "http.Response", true)
        .expectingPropertyToBe ("class.responses.length", 1)
        .expectingMethodToReturnValue ("class.defineResponse", "JsonReturned", s => s.class)
        .expectingPropertyToBe ("class.responses.length", 2)
        .commit ()
;
