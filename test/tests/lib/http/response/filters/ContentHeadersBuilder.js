const Context = nit.require ("http.Context");


test.method ("http.response.filters.ContentHeadersBuilder", "apply")
    .should ("add some common response headers")
        .given (nit.do (Context.create (), ctx =>
        {
            ctx.responseHeader ("Content-Type", "text/html");
        }))
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/html")
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.response = nit.new ("http.responses.FileReturned", "resources/html/page-one.html");
        }))
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/html")
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Length", 63)
        .expectingPropertyToBe ("args.0.responseHeaders.Last-Modified", /^Thu/)
        .commit ()

    .given (Context.create ("GET", "/export.csv"))
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/csv")
        .commit ()

    .given (Context.create ("GET", "/export"))
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type")
        .commit ()
;
