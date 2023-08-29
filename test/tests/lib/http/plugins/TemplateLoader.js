const http = nit.require ("http");


test.method ("http.plugins.TemplateLoader", "onUsePlugin", true)
    .should ("add template loading methods to the host class")
    .up (s => s.hostClass = s.http
        .defineConditional ("http.services.MyService")
        .defineInstanceDescriptor ()
    )
    .up (s => s.args = s.hostClass)
    .after (s => s.service = s.hostClass.Descriptor.build (
    {
        templateLoaders: { extensions: "html" }
    }))
    .expectingPropertyToBe ("hostClass.fieldMap.templateLoaders.array", true)
    .expectingPropertyToBe ("hostClass.fieldMap.templateLoaders.type", "http.TemplateLoader")
    .expectingPropertyToBe ("service.templateLoaders.length", 1)
    .expectingMethodToReturnValue ("service.loadTemplate", ["public/index.html", http.Context.new ()], /^<!DOCTYPE html/)
    .expectingMethodToThrow ("service.loadTemplate", ["public/index2.html", http.Context.new ()], "error.invalid_path")
    .expectingMethodToReturnValue ("service.loadTemplate", ["public/index.css", http.Context.new ()], undefined)
    .commit ()
;
