const Service = nit.require ("http.Service")
    .staticGetter ("TestService", function ()
    {
        return this.defineSubclass (this.name, true);
    })
;


nit.defineClass ("test.handlers.Noop", "http.Handler");


test.method (Service.TestService, "endpoint", true)
    .should ("add an endpoint declaration to the service")
        .given ("POST", "/resources", "test:noop")
        .expectingPropertyToBe ("class.endpoints.length", 1)
        .expectingPropertyToBe ("class.endpoints.0.route.method", "POST")
        .expectingPropertyToBe ("class.endpoints.0.route.path", "/resources")
        .expectingPropertyToBeOfType ("class.endpoints.0.handler", "test.handlers.Noop")
        .expectingMethodToReturnValue ("class.endpoints.0.matches", true, { method: "POST", path: "/resources" })
        .expectingMethodToReturnValue ("class.endpoints.0.matches", false, { method: "GET", path: "/resources" })
        .expectingMethodToReturnValue ("class.endpoints.0.matches", false, { method: "POST", path: "/users" })
        .commit ()

    .given ("POST", "/resources", nit.new ("test.handlers.Noop"))
        .expectingPropertyToBe ("class.endpoints.length", 2)
        .expectingPropertyToBeOfType ("class.endpoints.1.handler", "test.handlers.Noop")
        .commit ()
;


test.method (Service.TestService, "defineContext", true)
    .should ("define a service context")
        .given (function (cls)
        {
            cls.field ("db", "any");
        })
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("object.Context.name", "http.Service.Context")
        .commit ()
;


let certsDir = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");


test.object (Service.TestService, { recreate: true })
    .reset ("is a container for handlers")
        .given ("a.pushcorn.com", "b.pushcorn.com")
        .expectingPropertyToBe ("result.hostnameMatchers.length", 2)
        .expectingPropertyToBe ("result.secureContext", undefined)
        .commit ()

    .given ("*",
        {
            cert: certsDir.join ("pushcorn.com.crt"),
            key: certsDir.join ("pushcorn.com.key")
        })
        .expectingPropertyToBeOfType ("result.secureContext", "http.SecureContext")
        .commit ()
;


test.method (Service.TestService, "get", true)
    .should ("add a GET endpoint")
        .given ("/users", "test:noop")
        .expectingPropertyToBe ("result.endpoints.0.route.method", "GET")
        .expectingPropertyToBe ("result.endpoints.0.route.path", "/users")
        .commit ()
;


test.method (Service.TestService, "post", true)
    .should ("add a POST endpoint")
        .given ("/users", "test:noop")
        .expectingPropertyToBe ("result.endpoints.0.route.method", "POST")
        .expectingPropertyToBe ("result.endpoints.0.route.path", "/users")
        .commit ()
;


test.method (Service.TestService, "put", true)
    .should ("add a PUT endpoint")
        .given ("/users/1", "test:noop")
        .expectingPropertyToBe ("result.endpoints.0.route.method", "PUT")
        .expectingPropertyToBe ("result.endpoints.0.route.path", "/users/1")
        .commit ()
;


test.method (Service.TestService, "delete", true)
    .should ("add a DELETE endpoint")
        .given ("/users/1", "test:noop")
        .expectingPropertyToBe ("result.endpoints.0.route.method", "DELETE")
        .expectingPropertyToBe ("result.endpoints.0.route.path", "/users/1")
        .commit ()
;


test.method (Service.TestService, "head", true)
    .should ("add a HEAD endpoint")
        .given ("/users/1", "test:noop")
        .expectingPropertyToBe ("result.endpoints.0.route.method", "HEAD")
        .expectingPropertyToBe ("result.endpoints.0.route.path", "/users/1")
        .commit ()
;


test.method (Service.TestService, "getPriority")
    .should ("return the max priority of the specified hostname patterns")
        .up (function ()
        {
            this.createArgs = ["*.pushcorn.com"];
        })
        .given ("a.pushcorn.com")
        .returns (2)
        .commit ()

    .given ("a.pushcorn.com")
        .up (function ()
        {
            this.createArgs = ["*", "*.pushcorn.com"];
        })
        .returns (2)
        .commit ()

    .given ("a.pushcorn.com")
        .up (function ()
        {
            this.createArgs = ["*"];
        })
        .returns (1)
        .commit ()

    .given ("a.pushcorn.com")
        .up (function ()
        {
            this.createArgs = ["b.pushcorn.com"];
        })
        .returns (0)
        .commit ()
;


test.method (Service.TestService, "dispatch")
    .should ("run the service with mock request and response")
        .given ("POST", "/users", { headers: { a: 1 } })
        .before (function ()
        {
            this.class.endpoint ("POST", "/resources", "test:noop");
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.req.method", "POST")
        .expectingPropertyToBe ("result.req.path", "/users")
        .expectingPropertyToBe ("result.req.headers", { a: 1 })
        .commit ()
;


test.method (Service.TestService, "run")
    .should ("select the endpoint and run the handler")
        .given (nit.new ("http.Context",
            nit.new ("http.mocks.IncomingMessage", "POST", "/resources"),
            nit.new ("http.mocks.ServerResponse")
        ))
        .before (function ()
        {
            const ResourceCreated = nit.defineClass ("test.responses.ResourceCreated", "http.Response")
                .info (201, "The resource has been created.")
                .field ("<id>", "string", "The resource ID.")
                .field ("[name]", "string", "The resource name.")
            ;

            nit.defineClass ("test.handlers.CreateResource", "http.Handler")
                .run (function ()
                {
                    return new ResourceCreated ("1234", "new resource");
                })
            ;

            this.class.endpoint ("POST", "/resources", "test:create-resource");
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBeOfType ("result.response", "test.responses.ResourceCreated")
        .expectingPropertyToBe ("result.response.id", "1234")
        .expectingPropertyToBe ("result.response.name", "new resource")
        .commit ()

    .should ("just return the context if no matching endpoint was found")
        .given (nit.new ("http.Context",
            nit.new ("http.mocks.IncomingMessage", "GET", "/resources"),
            nit.new ("http.mocks.ServerResponse")
        ))
        .before (function ()
        {
            this.class.endpoint ("POST", "/resources", "test:create-resource");
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("result.response", undefined)
        .commit ()
;
