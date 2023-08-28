const Context = nit.require ("http.Context");


test.method ("http.responsefilters.EtagBuilder", "applicableTo")
    .should ("return %{result} if (ctx.req.method, ctx.responseHeaders.ETag, ctx.res.statusCode) = (%{args[0].req.method}, %{args[0].responseHeaders['ETag']|format}, %{args[0].res.statusCode})")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseHeader ("ETag", `"1234"`);
            ctx.res.statusCode = 200;
        }))
        .returns (false)
        .commit ()

    .given (nit.do (Context.new (), ctx =>
        {
            ctx.res.statusCode = 200;
        }))
        .returns (true)
        .commit ()
;


test.method ("http.responsefilters.EtagBuilder", "apply")
    .should ("add the ETag header if possible")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseBody = "test";
            ctx.res.statusCode = 200;
        }))
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", '"n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg-4"')
        .commit ()

    .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseBody = Buffer.from ("test");
            ctx.res.statusCode = 200;
        }))
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", '"n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg-4"')
        .commit ()

    .given (nit.do (Context.new (), ctx =>
        {
            ctx.response = nit.new ("http.responses.File", nit.path.join (test.TEST_PROJECT_PATH, "../package.json"));
        }))
        .before (async (s) => await s.args[0].writeResponse ())
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", /^W\/"/)
        .commit ()

    .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseBody = { a: 1 };
        }))
        .expectingPropertyToBe ("args.0.responseHeaders.ETag")
        .commit ()
;
