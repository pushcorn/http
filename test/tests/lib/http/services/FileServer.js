test.object ("http.services.FileServer")
    .should ("provide a service for static files")
    .expectingPropertyToBeOfType ("class.serviceplugins.0", "http.serviceplugins.FileServer")
    .commit ()
;


test.method ("http.services.FileServer", "init")
    .should ("use template filters if compileAssets is true")
        .up (s => s.createArgs = true)
        .expectingPropertyToBeOfType ("object.contextClass.responsefilters.4", "http.responsefilters.TemplateRenderer")
        .expectingPropertyToBeOfType ("object.contextClass.responsefilters.5", "http.responsefilters.TemplateRenderer")
        .commit ()

    .should ("not use template filters if compileAssets is false")
        .up (s => s.createArgs = false)
        .expectingPropertyToBe ("object.contextClass.responsefilters.length", 4)
        .commit ()
;
