const MESSAGE = "return %{result} when the name pattern is %{createArgs[0]|format} and hostname is %{args[0]|format}";


test.method ("http.HostnameMatcher", "matches", { createArgs: ["*"] })
    .should (MESSAGE)
        .given ("pushcorn.com")
        .returns (1)
        .commit ()
;


test.method ("http.HostnameMatcher", "matches", { createArgs: ["*.pushcorn.com"] })
    .should (MESSAGE)
        .given ("pushcorn.com")
        .returns (0)
        .commit ()
;


test.method ("http.HostnameMatcher", "matches", { createArgs: ["dev.*.pushcorn.com"] })
    .should (MESSAGE)
        .given ("dev.site.pushcorn.com")
        .returns (2)
        .commit ()
;


test.method ("http.HostnameMatcher", "matches", { createArgs: ["*.pushcorn.com"] })
    .should (MESSAGE)
        .given ("a.pushcorn.com")
        .returns (2)
        .commit ()
;


test.method ("http.HostnameMatcher", "matches", { createArgs: ["a.pushcorn.com"] })
    .should (MESSAGE)
        .given ("a.pushcorn.com")
        .returns (4)
        .commit ()
;


test.method ("http.HostnameMatcher", "matches", { createArgs: ["a.pushcorn.com"] })
    .should (MESSAGE)
        .given ("b.pushcorn.com")
        .returns (0)
        .commit ()
;


test.method ("http.HostnameMatcher", "matches", { createArgs: ["~(abc|def).pushcorn.com"] })
    .should (MESSAGE)
        .given ("a.pushcorn.com")
        .returns (0)
        .commit ()

    .given ("abc.pushcorn.com")
        .returns (3)
        .commit ()

    .given ("def.pushcorn.com")
        .returns (3)
        .commit ()
;
