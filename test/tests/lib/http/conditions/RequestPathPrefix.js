const Context = nit.require ("http.Context");


test.method ("http.conditions.RequestPathPrefix", "check")
    .should ("return %{result} when (prefix) = (/api) and the request path is %{args[0].req.path}")
        .up (function ()
        {
            this.createArgs = ["/api"];
        })
        .given (Context.new ("GET", "/users/1234"))
        .returns (false)
        .commit ()

    .reset ()
        .up (function ()
        {
            this.createArgs = ["/api"];
        })
        .given (Context.new ("GET", "/api2/users/1234"))
        .returns (false)
        .commit ()

    .reset ()
        .up (function ()
        {
            this.createArgs = ["/api"];
        })
        .given (Context.new ("GET", "/api2"))
        .returns (false)
        .commit ()

    .reset ()
        .up (function ()
        {
            this.createArgs = ["/api"];
        })
        .given (Context.new ("GET", "/api"))
        .returns (true)
        .commit ()

    .reset ()
        .up (function ()
        {
            this.createArgs = ["/api"];
        })
        .given (Context.new ("GET", "/api/users/1234"))
        .returns (true)
        .commit ()
;
