test.method ("http.services.FileServer", "init")
    .should ("add default asset resolver")
        .expectingPropertyToBe ("object.assetresolvers.length", 1)
        .expectingPropertyToBe ("object.templateloaders.length", 0)
        .commit ()

    .should ("not add default asset resolver if assetResolvers is not empty")
        .up (s => s.createArgs = { assetresolvers: { roots: "public" } })
        .expectingPropertyToBe ("object.assetresolvers.length", 1)
        .expectingPropertyToBe ("object.templateloaders.length", 0)
        .commit ()

    .should ("add default template loader if template is true")
        .up (s => s.createArgs = true)
        .expectingPropertyToBe ("object.assetresolvers.length", 1)
        .expectingPropertyToBe ("object.templateloaders.length", 1)
        .commit ()
;


test.method ("http.services.FileServer", "dispatch")
    .should ("try to load the index file if the response is empty")
        .up (s => s.createArgs = true)
        .givenContext ()
        .before (s => s.args[0].service = s.object)
        .before (s => s.object.init ())
        .after (s => s.args[0].writeResponse ())
        .expectingPropertyToBeOfType ("args.0.response", "http.responses.Text")
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/html")
        .commit ()

    .should ("just return if the response has been set")
        .givenContext ()
        .before (s => s.args[0].sendText ("test"))
        .returnsResultOfExpr ("args.0")
        .commit ()

    .should ("send the file if template is not enabled")
        .givenContext ()
        .before (s => s.args[0].service = s.object)
        .before (s => s.object.init ())
        .after (s => s.args[0].writeResponse ())
        .expectingPropertyToBeOfType ("args.0.response", "http.responses.File")
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/html")
        .commit ()

    .should ("use non-empty request path to find the file")
        .givenContext ("GET", "/index2.html")
        .before (s => s.args[0].service = s.object)
        .before (s => s.object.init ())
        .commit ()
;
