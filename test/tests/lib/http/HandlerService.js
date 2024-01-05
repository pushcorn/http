test.method ("http.HandlerService", "forHandler", true)
    .should ("register the handler class that will be used by the service")
        .given ("http.Api")
        .expectingPropertyToBe ("class.http\\.HandlerService\\.handlerClass.name", "http.Api")
        .commit ()

    .should ("throw if the handler class is not a subclass of http.Handler")
        .given ("http.Certificate")
        .throws ("error.not_handler_subclass")
        .commit ()
;


test.method ("http.HandlerService", "init")
    .should ("load handler of the specified type")
        .up (s => s.class = s.http.HandlerService
            .defineSubclass ("test.services.MyService")
            .forHandler ("http.Api"))
        .up (s => s.createArgs =
        {
            includes: "*.Hello"
        })
        .project ("myapp", true)
        .returnsInstanceOf ("test.services.MyService")
        .expectingPropertyToBe ("result.handlers.length", 1)
        .expectingPropertyToBeOfType ("result.handlers.0", "myapp.apis.Hello")
        .commit ()

    .should ("exclude the handlers that match the exclude patterns")
        .up (s => s.class = s.http.HandlerService
            .defineSubclass ("test.services.MyService")
            .forHandler ("http.Api"))
        .up (s => s.createArgs =
        {
            includes: ["http.*", "myapp.*"],
            excludes: "*.Hello"
        })
        .project ("myapp", true)
        .returnsInstanceOf ("test.services.MyService")
        .expectingPropertyToBe ("result.handlers.length", 4)
        .expectingPropertyToBeOfType ("result.handlers.0", "myapp.apis.AutoPath")
        .expectingPropertyToBeOfType ("result.handlers.1", "myapp.apis.CheckIn")
        .expectingPropertyToBeOfType ("result.handlers.2", "myapp.apis.GetBlob")
        .expectingPropertyToBeOfType ("result.handlers.3", "http.apis.GetApiSpec")
        .commit ()
;
