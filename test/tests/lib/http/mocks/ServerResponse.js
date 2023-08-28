test.method ("http.mocks.ServerResponse", "setHeader")
    .should ("set the response header")
    .given ("Content-type", "application/json")
    .returnsInstanceOf ("http.mocks.ServerResponse")
    .commit ()
;


test.method ("http.mocks.ServerResponse", "writeHead")
    .should ("set the status and headers")
        .given (200)
        .returnsInstanceOf ("http.mocks.ServerResponse")
        .expectingPropertyToBe ("object.statusCode", 200)
        .expectingPropertyToBe ("object.statusMessage", "")
        .expectingPropertyToBe ("object.headers", {})
        .commit ()

    .given (200, "Done", { "x-server": "nit" })
        .returnsInstanceOf ("http.mocks.ServerResponse")
        .expectingPropertyToBe ("object.statusCode", 200)
        .expectingPropertyToBe ("object.statusMessage", "Done")
        .expectingPropertyToBe ("object.headers", { "x-server": "nit" })
        .commit ()
;


test.method ("http.mocks.ServerResponse", "_write")
    .should ("add the data chunk")
        .given (Buffer.from ("ab"), "", function done () { done.called = true; })
        .returns ()
        .expectingPropertyToBe ("object.data", Buffer.from ("ab"))
        .expectingPropertyToBe ("args.2.called", true)
        .commit ()

    .given (Buffer.from ("cd"), "", function done () { done.called = true; })
        .before (function ()
        {
            this.object.data = Buffer.from ("ab");
        })
        .returns ()
        .expectingPropertyToBe ("object.data", Buffer.from ("abcd"))
        .expectingPropertyToBe ("args.2.called", true)
        .commit ()
;


test.method ("http.mocks.ServerResponse", "end")
    .should ("end response")
        .given ("This is a test", "", function done () { done.called = true; })
        .after (async () => await nit.sleep (50))
        .returnsInstanceOf ("http.mocks.ServerResponse")
        .expectingPropertyToBe ("object.data", Buffer.from ("This is a test"))
        .expectingPropertyToBe ("args.2.called", true)
        .commit ()
;
