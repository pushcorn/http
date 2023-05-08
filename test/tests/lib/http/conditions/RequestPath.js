const Context = nit.require ("http.Context");


test.method ("http.conditions.RequestPath", "check")
    .should ("return %{result} when (methods) = (%{createArgs.0}) and the request path is %{args[0].req.path}")
        .init (function ()
        {
            this.createArgs = ["/users/:id"];
        })
        .given (Context.create ("GET", "/users/1234"))
        .returns (true)
        .commit ()

    .reset ()
        .init (function ()
        {
            this.createArgs = ["/groups/:id"];
        })
        .given (Context.create ("GET", "/users/1234"))
        .returns (false)
        .commit ()
;

