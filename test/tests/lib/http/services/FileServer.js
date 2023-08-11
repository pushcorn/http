test.object ("http.services.FileServer")
    .should ("provide a service for static files")
        .expectingPropertyToBeOfType ("class.serviceplugins.0", "http.serviceplugins.FileServer")
        .expectingPropertyToContain ("class.serviceplugins.0.roots", [nit.path.join (nit.HOME, "public")])
        .expectingPropertyToBe ("class.serviceplugins.0.indexes.length", 2)
        .commit ()

    .should ("provided roots and indexes to create the plugin")
        .given ({ roots: "dist", indexes: "index.html" })
        .expectingPropertyToContain ("class.serviceplugins.0.roots", [nit.path.join (nit.HOME, "dist")])
        .expectingPropertyToBe ("class.serviceplugins.0.indexes.length", 1)
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
