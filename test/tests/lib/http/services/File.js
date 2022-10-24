const Context = nit.require ("http.Context");


test.object ("http.services.File")
    .should ("provide a service for static files")
    .expectingPropertyToBeOfType ("class.servicePlugins.0", "http.service.plugins.FileServer")
    .commit ()
;


test.method ("http.services.File", "dispatch")
    .should ("set the response for the index file when possible")
    .given (Context.create ())
    .expectingPropertyToBeOfType ("args.0.response", "http.responses.FileReturned")
    .expectingPropertyToBe ("args.0.response.path", nit.resolveAsset ("public/index.html"))
    .commit ()
;
