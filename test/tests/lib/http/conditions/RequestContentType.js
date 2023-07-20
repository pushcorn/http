const Context = nit.require ("http.Context");


test.method ("http.conditions.RequestContentType", "check",
    {
        createArgs: ["text/html"]
    })
    .should ("return %{result} when (types) = (%{createArgs.0}) and the request content-type header is %{args[0].req.headers['content-type']}")
    .given (nit.do (Context.new ("GET", "/"), (ctx) =>
    {
        ctx.req.headers["content-type"] = "text/html";
    }))
    .returns (true)
    .commit ()
;


test.method ("http.conditions.RequestContentType", "check",
    {
        createArgs: ["text/*"]
    })
    .should ("return %{result} when (types) = (%{createArgs.0}) and the request content-type header is %{args[0].req.headers['content-type']}")
    .given (nit.do (Context.new ("GET", "/"), (ctx) =>
    {
        ctx.req.headers["content-type"] = "text/html";
    }))
    .returns (true)
    .commit ()
;


test.method ("http.conditions.RequestContentType", "check",
    {
        createArgs: ["*/json"]
    })
    .should ("return %{result} when (types) = (%{createArgs.0}) and the request content-type header is %{args[0].req.headers['content-type']}")
    .given (nit.do (Context.new ("GET", "/"), (ctx) =>
    {
        ctx.req.headers["content-type"] = "text/html";
    }))
    .returns (false)
    .commit ()
;
