const Context = nit.require ("http.Context");


test.method ("http.response.filters.CacheController", "appliesTo")
    .should ("return %{result} if (ctx.req.method, ctx.req.headers.cache-control, ctx.res.statusCode) = (%{args[0].req.method}, %{args[0].headerParams['cache-control']|format}, %{args[0].res.statusCode})")
        .given (nit.do (Context.create (), ctx =>
        {
            ctx.headerParams = { "cache-control": "" };
            ctx.res.statusCode = 200;
        }))
        .returns (true)
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.headerParams = { "cache-control": "no-cache" };
            ctx.res.statusCode = 200;
        }))
        .returns (false)
        .commit ()

    .given (nit.do (Context.create ("POST"), ctx =>
        {
            ctx.res.statusCode = 201;
        }))
        .returns (false)
        .commit ()
;


test.method ("http.response.filters.CacheController", "notChanged")
    .should ("return %{result} if (ctx.headerParams.if-none-match, ctx.responseHeaders.etag) = (%{args[0].headerParams['if-none-match']}, %{args[0].responseHeaders.ETag})")
        .given (Context.create ())
        .returns (false)
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.responseHeader ("ETag", `"1234"`);
        }))
        .returns (false)
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.headerParams = { "if-none-match": `"1234"` };
            ctx.responseHeader ("ETag", `"1234"`);
        }))
        .returns (true)
        .commit ()
;


test.method ("http.response.filters.CacheController", "notModified")
    .should ("return %{result} if (ctx.headerParams.if-modified-since, ctx.responseHeaders.Last-Modified) = (%{args[0].headerParams['if-modified-since']}, %{args[0].responseHeaders['Last-Modified']})")
        .given (Context.create ())
        .returns (false)
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.headerParams = { "if-modified-since": "Tue" };
            ctx.responseHeader ("Last-Modified", "Mon");
        }))
        .returns (false)
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.headerParams = { "if-modified-since": "Mon" };
            ctx.responseHeader ("Last-Modified", "Mon");
        }))
        .returns (true)
        .commit ()
;


test.method ("http.response.filters.CacheController", "apply")
    .should ("set the response to 304 if the content was not modified")
        .given (Context.create ())
        .expectingPropertyToBe ("args.0.res.statusCode", 0)
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.headerParams = { "if-modified-since": "Mon" };
            ctx.responseHeader ("Last-Modified", "Mon");
            ctx.responseHeader ("Cache-Control", "max-age=10");
        }))
        .expectingPropertyToBe ("args.0.res.statusCode", 304)
        .expectingPropertyToBe ("args.0.responseHeaders.Cache-Control", "max-age=10")
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.headerParams = { "if-none-match": `"1234"` };
            ctx.responseHeader ("ETag", `"1234"`);
        }))
        .expectingPropertyToBe ("args.0.res.statusCode", 304)
        .expectingPropertyToBe ("args.0.responseHeaders.Cache-Control", "max-age=0, must-revalidate")
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.headerParams = { "if-none-match": `"12345"` };
            ctx.responseHeader ("ETag", `"1234"`);
        }))
        .expectingPropertyToBe ("args.0.res.statusCode", 0)
        .expectingPropertyToBe ("args.0.responseHeaders.Cache-Control", "max-age=0, must-revalidate")
        .commit ()
;
