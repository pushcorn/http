const Context = nit.require ("http.Context");


test.method ("http.response.filters.TemplateRenderer", "appliesTo", { createArgs: "text/html" })
    .should ("return %{result} if (contentType, ctx.responseHeaders.content-type) = (%{createArgs[0]}, %{args[0].responseHeaders['Content-Type']})")
        .given (nit.do (Context.create (), ctx =>
        {
            ctx.responseHeader ("Content-Type", "text/html");
        }))
        .returns (true)
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.responseHeader ("Content-Type", "text/css");
        }))
        .returns (false)
        .commit ()
;


test.method ("http.response.filters.TemplateRenderer", "apply", { createArgs: "text/html" })
    .should ("render the response content")
        .given (nit.do (Context.create (), ctx =>
        {
            ctx.response = nit.new ("http.responses.FileReturned", "resources/html/page-two.html");
        }))
        .expectingPropertyToBe ("args.0.responseBody", "This is page two!\n")
        .expecting ("the cache contains the entry for page-two.html", true, function (s)
        {
            return !!s.object.cache.entries[nit.resolveAsset ("resources/html/page-two.html")];
        })
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.response = nit.new ("http.responses.FileReturned", "resources/html/page-one.html");
        }))
        .expectingPropertyToBe ("args.0.responseBody", "This is page one.\nThis is page two!\n\n")
        .expecting ("the cache contains the entries for page-one.html and page-two.html", true, function (s)
        {
            return !!s.object.cache.entries[nit.resolveAsset ("resources/html/page-one.html")]
                && !!s.object.cache.entries[nit.resolveAsset ("resources/html/page-two.html")];
        })
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.responseBody = "1 + 1 = {% 1 + 1 %}";
        }))
        .expectingPropertyToBe ("args.0.responseBody", "1 + 1 = 2")
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.responseBody = "1 + 1 = {% 1 + 1 %}";
        }))
        .expectingPropertyToBe ("args.0.responseBody", "1 + 1 = 2")
        .commit ()
;
