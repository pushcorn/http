const Context = nit.require ("http.Context");


test.method ("http.conditions.ResponseCompressible", "check")
    .should ("return %{result} the response content-type is %{args[0].responseHeaders['content-type']}")
    .given (nit.do (Context.new ("GET", "/"), ctx =>
    {
        ctx.responseHeader ("content-type", "application/json");
    }))
    .returns (true)
    .commit ()
;


test.method ("http.conditions.ResponseCompressible", "check")
    .should ("return %{result} the response content-type is %{args[0].responseHeaders['content-type']}")
    .given (nit.do (Context.new ("GET", "/"), ctx =>
    {
        ctx.responseHeader ("content-type", "text/html");
    }))
    .returns (true)
    .commit ()
;



test.method ("http.conditions.ResponseCompressible", "check")
    .should ("return %{result} the response content-type is %{args[0].responseHeaders['content-type']}")
    .given (nit.do (Context.new ("GET", "/"), ctx =>
    {
        ctx.responseHeader ("content-type", "application/gzip");
    }))
    .returns (false)
    .commit ()
;

