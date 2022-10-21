const Context = nit.require ("http.Context");


test.method ("http.conditions.ResponseContentType", "check",
    {
        createArgs: ["text/html"]
    })
    .should ("return %{result} when (types) = (%{createArgs.0}) and the response content-type header is %{args[0].responseHeaders['content-type']}")
    .given (nit.do (Context.create ("GET", "/"), (ctx) =>
    {
        ctx.responseHeader ("content-type", "text/html");
    }))
    .returns (true)
    .commit ()
;


test.method ("http.conditions.ResponseContentType", "check",
    {
        createArgs: ["text/*"]
    })
    .should ("return %{result} when (types) = (%{createArgs.0}) and the response content-type header is %{args[0].responseHeaders['content-type']}")
    .given (nit.do (Context.create ("GET", "/"), (ctx) =>
    {
        ctx.responseHeader ("content-type", "text/html");
    }))
    .returns (true)
    .commit ()
;


test.method ("http.conditions.ResponseContentType", "check",
    {
        createArgs: ["*/json"]
    })
    .should ("return %{result} when (types) = (%{createArgs.0}) and the response content-type header is %{args[0].responseHeaders['content-type']}")
    .given (nit.do (Context.create ("GET", "/"), (ctx) =>
    {
        ctx.responseHeader ("content-type", "text/html");
    }))
    .returns (false)
    .commit ()
;
