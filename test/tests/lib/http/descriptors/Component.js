test.object ("http.descriptors.Component")
    .should ("have the name and options fields")
    .given ("http:hostname", "app.pushcorn.com")
    .expectingPropertyToBe ("result.name", "http:hostname")
    .expectingPropertyToBe ("result.options", "app.pushcorn.com")
    .commit ()
;
