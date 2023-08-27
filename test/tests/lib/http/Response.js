const http = nit.require ("http");
const Response = nit.require ("http.Response")
    .staticGetter ("testClass", function ()
    {
        return this.defineSubclass (this.name, true)
            .field ("mesg", "string?")
        ;
    })
;


test.method (Response.testClass, "info", true)
    .should ("update the status info")
        .given (200, "OK")
        .returnsInstanceOf ("function")
        .expectingPropertyToBe ("result.status", 200)
        .expectingPropertyToBe ("result.message", "OK")
        .commit ()

    .given (201)
        .returnsInstanceOf ("function")
        .expectingPropertyToBe ("result.status", 201)
        .expectingPropertyToBe ("result.message", "Created")
        .commit ()

    .given (201, "")
        .returnsInstanceOf ("function")
        .expectingPropertyToBe ("result.status", 201)
        .expectingPropertyToBe ("result.message", "Created")
        .commit ()
;


test.method (Response.testClass, "toPojo")
    .should ("convert the response to a pojo")
        .returns ({})
        .commit ()
;


test.method (Response.testClass.field ("<id>", "string"), "toPojo", { createArgs: ["1234"] })
    .should ("convert the response to a pojo")
        .returns ({ id: "1234" })
        .commit ()
;


test.method (Response.testClass.field ("<id>", "string"), "toBody", { createArgs: ["1234"] })
    .should ("return the response body")
        .given (http.Context.new ("GET", "/"))
        .returns (`{"id":"1234"}`)
        .commit ()
;


test.method (Response.testClass.field ("<id>", "string"), "toBody", { createArgs: ["1234"] })
    .should ("return the value of a given property")
        .given (http.Context.new ("GET", "/"), "id")
        .returns (`"1234"`)
        .commit ()
;


test.method (Response.testClass, "toBody")
    .should ("serialize the response into JSON")
        .given (http.Context.new ("GET", "/"))
        .returns ("{}")
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "application/json")
        .commit ()
;


test.method (Response.defineSubclass ("Response", true), "toBody")
    .should ("serialize the to an empty string if no fields were defined")
        .given (http.Context.new ("GET", "/"))
        .returns ("")
        .commit ()
;
