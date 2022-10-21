test.method ("http.conditions.Custom", "check",
    {
        createArgs: [() => true]
    })
    .should ("use a custom checker to perform the condition checking")
        .returns (true)
        .commit ()

    .up (function () { this.createArgs = [() => 3]; })
        .returns (true)
        .commit ()

    .up (function () { this.createArgs = [() => undefined]; })
        .returns (false)
        .commit ()
;
