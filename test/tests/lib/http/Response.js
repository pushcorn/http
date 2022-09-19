const no_stream = require ("stream");
const Response = nit.require ("http.Response")
    .staticGetter ("testClass", function ()
    {
        return this.defineSubclass (this.name, true);
    })
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
        .returns (JSON.stringify (
        {
            "@name": "Response",
            "@status": 404,
            "@message": "Not Found"
        }))
        .commit ()
;


test.method (Response.testClass, "write")
    .should ("write the data to the given ServerResponse object")
        .given (nit.new ("http.mocks.ServerResponse"))
        .expectingPropertyToBe ("args.0.data", (new Response.testClass).toBody ())
        .commit ()

    .should ("write an empty string if toBod () returns undefined")
        .given (nit.new ("http.mocks.ServerResponse"))
        .before (function ()
        {
            this.class.method ("toBody", function () {});
        })
        .expectingPropertyToBe ("args.0.data", "")
        .commit ()

    .should ("pipe the data to the ServerResponse the toBody () returns a stream")
        .before (function ()
        {
            let strategy = this;

            this.class
                .method ("toBody", function ()
                {
                    let readable = new no_stream.Readable ();

                    readable._read = function () { strategy.readCalled = true; };

                    return readable;
                })
            ;
        })
        .given (nit.new ("http.mocks.ServerResponse"))
        .after (async function ()
        {
            await nit.sleep (10);
        })
        .expectingPropertyToBe ("readCalled", true)
        .commit ()

;
