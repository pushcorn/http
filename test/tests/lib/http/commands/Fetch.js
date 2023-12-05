test.command ("http.commands.Fetch")
    .should ("fetch the resource from the given URL")
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
        .returns ({ message: "Hello" })
        .commit ()

    .should ("return the response object if verbose is true")
        .given ("http://localhost/hello",
        {
            headers: "Accept: application/json",
            verbose: true
        })
        .mock ("http", "fetch", function (opts)
        {
            this.strategy.headers = opts.headers;

            return nit.new ("http.mocks.IncomingMessage", "GET", "http://localhost/hello",
            {
                statusCode: 200,
                statusMessage: "OK",
                data: { message: "Hello" },
                headers:
                {
                    "content-type": "application/json"
                }
            });
        })
        .returns (
        {
            statusCode: 200,
            statusMessage: "OK",
            headers:
            {
                "content-type": "application/json",
                host: "localhost"
            }
            ,
            body: { message: "Hello" }
        })
        .commit ()

    .should ("return the binary result if not JSON")
        .given ("http://localhost/hello")
        .mock ("http", "fetch", function ()
        {
            return nit.new ("http.mocks.IncomingMessage", "GET", "http://localhost/hello",
            {
                data: Buffer.from ("Hello there!")
            });
        })
        .returns ("Hello there!")
        .commit ()
;
