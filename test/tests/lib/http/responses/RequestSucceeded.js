test.object ("http.responses.RequestSucceeded")
    .should ("have the data field")
        .given ({ data: { a: 1 } })
        .expectingPropertyToBe ("result.data", { a: 1 })
        .commit ()
;
