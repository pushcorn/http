const http = nit.require ("http");
const Context = nit.require ("http.Context");

function defineApi ()
{
    return http.defineApi ("http.Api", true);
}


test.method (defineApi ().Context, "respond")
    .should ("throw if the argument is not a response and the API does not define any response")
        .up (s => s.createArgs = Context.new ("GET", "/"))
        .given ("the data")
        .throws ("error.no_default_response")
        .commit ()

    .should ("create the response if the first argument is not an instance of response")
        .up (s => s.createArgs = Context.new ("GET", "/"))
        .before (s => s.class.outerClass.response ("http:text"))
        .given ("the data")
        .expectingPropertyToBeOfType ("result.response", "http.responses.Text")
        .expectingPropertyToBe ("result.response.text", "the data")
        .commit ()

    .should ("just send the response if it is an instance of response")
        .up (s => s.createArgs = Context.new ("GET", "/"))
        .given (nit.new ("http.responses.RequestFailed", "error!"))
        .expectingPropertyToBeOfType ("result.response", "http.responses.RequestFailed")
        .expectingPropertyToBe ("result.response.data", "error!")
        .commit ()
;


test.method (defineApi (), "info", true)
    .should ("set the description meta data")
        .given ("find users")
        .expectingPropertyToBe ("class.description", "find users")
        .commit ()
;


test.method (defineApi (), "preInit")
    .should ("skip if the request has no parameters")
        .expectingPropertyToBe ("class.responses.length", 0)
        .commit ()

    .should ("add ValidationFailed response to the response list if the request has at least one parameter")
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
;


test.method (defineApi (), "postRun")
    .should ("throw if the returned response was not in the list of allowed responses")
        .given (Context.new ("GET", "/"))
        .before (s =>
        {
            s.class.response ("http:file");
            s.args[0].noop ();
        })
        .throws ("error.response_not_allowed")
        .commit ()
;


test.method (defineApi (), "postRun")
    .should ("skip if the allowed response was not specified")
        .given (Context.new ("GET", "/"))
        .before (s =>
        {
            s.args[0].noop ();
        })
        .returns ()
        .commit ()
;


test.method (defineApi (), "preCatch")
    .should ("send the ValidationFailed response if the error code is error.model_validation_failed")
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
        .given (Context.new ("GET", "/"))
        .before (s =>
        {
            s.args[0].error = new Error ("err");
            s.args[0].error.code = "error.invalid_value";
        })
        .expectingPropertyToBe ("args.0.error.code", "error.invalid_value")
        .commit ()

;
