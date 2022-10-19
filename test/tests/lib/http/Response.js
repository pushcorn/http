const http = nit.require ("http");
const Response = nit.require ("http.Response")
    .staticGetter ("testClass", function ()
    {
        return this.defineSubclass (this.name, true);
    })
;


test.object (Response.testClass, true)
    .should ("override the class defaults with the specified constructor args")
        .given ({ "@name": "InvalidInput" })
        .expectingMethodToReturnValue ("result.toPojo", { "@name": "InvalidInput", "@message": "Not Found", "@status": 404 })
        .commit ()

    .given ({ "@status": 401 })
        .expectingMethodToReturnValue ("result.toPojo", { "@name": "Response", "@message": "Not Found", "@status": 401 })
        .commit ()

    .given ({ "@message": "Invalid Input" })
        .expectingMethodToReturnValue ("result.toPojo", { "@name": "Response", "@message": "Invalid Input", "@status": 404 })
        .commit ()
;


test.method (Response.testClass, "info", true)
    .should ("update the status info")
        .given (200, "OK")
        .returnsInstanceOf ("function")
        .expectingPropertyToBe ("result.STATUS", 200)
        .expectingPropertyToBe ("result.MESSAGE", "OK")
        .commit ()

    .given (201)
        .returnsInstanceOf ("function")
        .expectingPropertyToBe ("result.STATUS", 201)
        .expectingPropertyToBe ("result.MESSAGE", "Not Found")
        .commit ()

    .given (201, "")
        .returnsInstanceOf ("function")
        .expectingPropertyToBe ("result.STATUS", 201)
        .expectingPropertyToBe ("result.MESSAGE", "")
        .commit ()
;


test.method (Response.testClass, "toPojo")
    .should ("convert the response to a pojo")
        .returns (
        {
            "@name": "Response",
            "@status": 404,
            "@message": "Not Found"
        })
        .commit ()
;


test.method (Response.testClass.field ("<id>", "string"), "toPojo", { createArgs: ["1234"] })
    .should ("convert the response to a pojo")
        .returns (
        {
            "@name": "Response",
            "@status": 404,
            "@message": "Not Found",
            "id": "1234"
        })
        .commit ()
;


test.method (Response.testClass, "toBody")
    .should ("serialize the response into JSON")
        .given (http.Context.create ("GET", "/"))
        .returns (JSON.stringify (
        {
            "@name": "Response",
            "@status": 404,
            "@message": "Not Found"
        }))
        .commit ()
;
