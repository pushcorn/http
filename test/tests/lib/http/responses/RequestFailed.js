test.object ("http.responses.RequestFailed")
    .should ("have the code and data fields")
        .given ({ code: "error.password_too_short", data: { a: 1 } })
        .expectingPropertyToBe ("result.code", "error.password_too_short")
        .expectingPropertyToBe ("result.data", { a: 1 })
        .commit ()
;
