test.object ("http.PathParser")
    .should ("throw if the param is defined more than onces")
        .given ("/users/*/name/*")
        .throws ("error.duplicate_param_name")
        .commit ()
;


test.method ("http.PathParser", "parse", { createArgs: ["/users/:id"] })
    .should ("parse the path %{args.0|format} into %{result} when the pattern is %{createArgs.0|format}")
        .given ("/users/1234")
        .returns ({ id: "1234" })
        .commit ()

    .given ("/users")
        .returns ()
        .commit ()

    .given ("/users/1234/name/john")
        .up (function () { this.createArgs = ["/users/*"]; })
        .returns ({ "*": "1234/name/john" })
        .commit ()

    .given ("/users/1234/name/john")
        .up (function () { this.createArgs = ["/users/*/john"]; })
        .returns ({ "*": "1234/name" })
        .commit ()
;


test.method ("http.PathParser", "build", { createArgs: ["/users/:id"] })
    .should ("build the path %{result|format} from %{args.0} when the pattern is %{createArgs.0|format}")
        .given ({ id: "1234" })
        .returns ("/users/1234")
        .commit ()

    .given ({ id: "1234" })
        .up (function () { this.createArgs = ["/users"]; })
        .returns ("/users")
        .commit ()

    .given ({ id: "1234" })
        .up (function () { this.createArgs = ["/users/:id/resources/:resourceId"]; })
        .returns ("/users/1234/resources/resourceId")
        .commit ()

    .given ({ "*": "1234/name/john" })
        .up (function () { this.createArgs = ["/users/*"]; })
        .returns ("/users/1234/name/john")
        .commit ()

    .given ({})
        .up (function () { this.createArgs = ["/users/*"]; })
        .returns ("/users")
        .commit ()

    .given ({ "*": "1234/567" })
        .up (function () { this.createArgs = ["/users/*/resource"]; })
        .returns ("/users/1234/567/resource")
        .commit ()
;
