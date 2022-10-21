test.method ("http.conditions.NoResponseHeader", "check",
    {
        createArgs: ["content-type", "cache-control"]
    })
    .should ("return %{result} when (names) = (%{createArgs.0}, %{createArgs.1}) and the response header is %{args.0}")
    .given (
    {
        responseHeader: function (n)
        {
            let headers = { "content-type": "application/json" };

            return headers[n];
        }
    })
    .returns (false)
    .commit ()
;


test.method ("http.conditions.NoResponseHeader", "check",
    {
        createArgs: ["x-server", "cache-control"]
    })
    .should ("return %{result} when (names) = (%{createArgs.0}, %{createArgs.1}) and the response header is %{args.0}")
    .given (
    {
        responseHeader: function (n)
        {
            let headers = { "content-type": "application/json" };

            return headers[n];
        }
    })
    .returns (true)
    .commit ()
;
