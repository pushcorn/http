test.task ("http:fetch")
    .should ("fetch the data from the server")
        .given ("http://localhost/hello",
        {
            headers: "Accept: application/json"
        })
        .mock ("http", "fetch", function (opts)
        {
            this.strategy.headers = opts.headers;

            return nit.new ("http.mocks.IncomingMessage", "GET", "http://localhost/hello",
            {
                data: { message: "Hello" },
                headers:
                {
                    "content-type": "application/json"
                }
            });
        })
        .returnsInstanceOf ("http.tasks.Fetch.Context")
        .expectingPropertyToBe ("result.result", { message: "Hello" })
        .expectingPropertyToBe ("headers", { Accept: "application/json" })
        .commit ()

    .reset ()
        .given ("http://localhost/hello")
        .mock ("http", "fetch", function ()
        {
            return nit.new ("http.mocks.IncomingMessage", "GET", "http://localhost/hello",
            {
                data: Buffer.from ("Hello there!")
            });
        })
        .expectingPropertyToBe ("result.result", "Hello there!")
        .commit ()
;
