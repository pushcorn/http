const Context = nit.require ("http.Context");


test.method ("http.conditions.RequestAcceptEncoding", "check",
    {
        createArgs: ["gzip", "deflate"]
    })
    .should ("return %{result} when (encodings) = (%{createArgs.0}, %{createArgs.1}) and the accept-encoding header is %{args[0].req.headers['accept-encoding']}")
    .given (nit.do (Context.create ("GET", "/"), (ctx) =>
    {
        ctx.req.headers["accept-encoding"] = "gzip";
    }))
    .returns (true)
    .expectingPropertyToBe ("args.0.responseEncoding", "gzip")
    .commit ()
;


test.method ("http.conditions.RequestAcceptEncoding", "check",
    {
        createArgs: ["gzip", "br"]
    })
    .should ("return %{result} when (encodings) = (%{createArgs.0}, %{createArgs.1}) and the accept-encoding header is %{args[0].req.headers['accept-encoding']}")
    .given (nit.do (Context.create ("GET", "/"), (ctx) =>
    {
        ctx.req.headers["accept-encoding"] = "deflate";
    }))
    .returns (false)
    .expectingPropertyToBe ("args.0.responseEncoding", "")
    .commit ()
;
