const Context = nit.require ("http.Context");


test.method ("http.conditions.RequestPath", "check")
    .should ("return %{result} when (path) = (/users/:id) and the request path is %{args[0].req.path}")
        .up (function ()
        {
            this.createArgs = ["/users/:id"];
        })
        .given (Context.new ("GET", "/users/1234"))
        .returns (true)
        .commit ()

    .should ("return %{result} when (path) = (/groups/:id) and the request path is %{args[0].req.path}")
        .up (function ()
        {
            this.createArgs = ["/groups/:id"];
        })
        .given (Context.new ("GET", "/users/1234"))
        .returns (false)
        .commit ()
;

