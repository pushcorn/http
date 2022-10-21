const Context = nit.require ("http.Context");


test.method ("http.conditions.RequestMethod", "check",
    {
        createArgs: ["POST"]
    })
    .should ("return %{result} when (methods) = (%{createArgs.0}) and the request method is %{args[0].req.method}")
    .given (Context.create ("GET", "/"))
    .returns (false)
    .commit ()
;


test.method ("http.conditions.RequestMethod", "check",
    {
        createArgs: ["GET"]
    })
    .should ("return %{result} when (methods) = (%{createArgs.0}) and the request method is %{args[0].req.method}")
    .given (Context.create ("GET", "/"))
    .returns (true)
    .commit ()
;

