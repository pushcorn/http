test.object ("http.services.FileServer")
    .should ("provide a service for static files")
    .expectingPropertyToBeOfType ("class.serviceplugins.0", "http.serviceplugins.FileServer")
    .commit ()
;


test.method ("http.services.FileServer", "init")
    .should ("use template filters if compileAssets is true")
        .init (function ()
        {
            this.createArgs = true;
        })
        .expectingPropertyToBeOfType ("object.contextClass.responsefilters.0", "http.responsefilters.TemplateRenderer")
        .commit ()

    .should ("not use template filters if compileAssets is false")
        .init (function ()
        {
            this.createArgs = false;
        })
        .expectingPropertyToBe ("object.contextClass.responsefilters.length", 0)
        .commit ()
;
