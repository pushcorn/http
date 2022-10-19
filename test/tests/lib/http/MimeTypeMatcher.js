test.method ("http.MimeTypeMatcher", "matches", { createArgs: ["*/json"] })
    .should ("return %{result} if the pattern is %{createArgs.0|format} and the type is %{args.0|format}")
        .given ("application/json")
        .returns (true)
        .commit ()

    .given ("text/html")
        .returns (false)
        .commit ()
;

test.method ("http.MimeTypeMatcher", "matches", { createArgs: ["*/*+json"] })
    .should ("return %{result} if the pattern is %{createArgs.0|format} and the type is %{args.0|format}")
        .given ("application/calendar+json")
        .returns (true)
        .commit ()
;
