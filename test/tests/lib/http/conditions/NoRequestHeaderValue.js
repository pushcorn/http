test.method ("http.conditions.NoRequestHeaderValue", "check",
    {
        createArgs: ["Cache-Control", "no-cache"]
    })
    .should ("return %{result} when (header, value) = (%{createArgs.0}, %{createArgs.1}) and the request header is %{args.0}")
    .given (
    {
        req:
        {
            headers:
            {
                "cache-control": "no-store"
            }
        }
    })
    .returns (true)
    .commit ()
;


test.method ("http.conditions.NoRequestHeaderValue", "check",
    {
        createArgs: ["Cache-Control", "no-cache"]
    })
    .should ("return %{result} when (header, value) = (%{createArgs.0}, %{createArgs.1}) and the request header is %{args.0}")
    .given (
    {
        req:
        {
            headers:
            {
                "cache-control": "no-cache"
            }
        }
    })
    .returns (false)
    .commit ()
;
