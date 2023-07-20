const Context = nit.require ("http.Context");


test.method ("http.conditions.ResponseStatus", "check",
    {
        createArgs: ["2xx"]
    })
    .should ("return %{result} when (codes) = (%{createArgs.0|format}) and the response status code is %{args[0].res.statusCode}")
    .given (nit.do (Context.new ("GET", "/"), (ctx) =>
    {
        ctx.res.statusCode = 200;
    }))
    .returns (true)
    .commit ()
;



test.method ("http.conditions.ResponseStatus", "check",
    {
        createArgs: [204]
    })
    .should ("return %{result} when (codes) = (%{createArgs.0|format}) and the response status code is %{args[0].res.statusCode}")
    .given (nit.do (Context.new ("GET", "/"), (ctx) =>
    {
        ctx.res.statusCode = 200;
    }))
    .returns (false)
    .commit ()
;



test.method ("http.conditions.ResponseStatus", "check",
    {
        createArgs: [200]
    })
    .should ("return %{result} when (codes) = (%{createArgs.0|format}) and the response status code is %{args[0].res.statusCode}")
    .given (nit.do (Context.new ("GET", "/"), (ctx) =>
    {
        ctx.res.statusCode = 200;
    }))
    .returns (true)
    .commit ()
;

