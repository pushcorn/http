test.object ("http.Parameter")
    .should ("throw if the source is assigned to an invalid value")
        .given ("id", "string", { source: "any" })
        .throws ("error.invalid_source_type")
        .commit ()

    .should ("allow valid source type")
        .given ("id", "string", { source: "path" })
        .returnsInstanceOf ("http.Parameter")
        .commit ()

    .should ("allow empty source type")
        .given ("id", "string")
        .returnsInstanceOf ("http.Parameter")
        .expectingPropertyToBe ("result.source", "")
        .commit ()

    .should ("use the param name as the source name if not defined")
        .given ("id", "string")
        .returnsInstanceOf ("http.Parameter")
        .expectingPropertyToBe ("result.sourceName", "id")
        .commit ()

    .should ("use the defined source name")
        .given ("id", "string", { sourceName: "refId" })
        .returnsInstanceOf ("http.Parameter")
        .expectingPropertyToBe ("result.sourceName", "refId")
        .commit ()
;
