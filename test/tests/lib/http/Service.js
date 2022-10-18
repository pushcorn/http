const http = nit.require ("http");
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

    .given ("GET", "/version", function (ctx) { ctx.send ("http:request-succeeded"); })
        .expectingPropertyToBe ("class.endpoints.length", 3)
        .expectingPropertyToBeOfType ("class.endpoints.2.handler", "FuncHandler")
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
    .should ("run the plugins and handler for the request")
        .given (http.Context.create ("POST", "/users", { headers: { a: 1 } }))
        .before (function ()
        {
            const Plugin = nit.defineClass ("Plugin", "http.service.Plugin", true);

            this.plugin = new Plugin;
            this.class.endpoint ("GET", "/users/:id", "test:noop");
            this.class.endpoint ("POST", "/users", "test:noop");
            this.class.servicePlugin (this.plugin);
        })
        .mock ("plugin", "preDispatch", function () {})
        .mock ("plugin", "postDispatch", function () {})
        .mock ("class.endpoints.0.handler", "run")
        .mock ("class.endpoints.1.handler", "run")
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBeOfType ("mocks.0.invocations.0.args.0", "http.Service")
        .expectingPropertyToBeOfType ("mocks.0.invocations.0.args.1", "http.Context")
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .expectingPropertyToBeOfType ("mocks.1.invocations.0.args.0", "http.Service")
        .expectingPropertyToBeOfType ("mocks.1.invocations.0.args.1", "http.Context")
        .expectingPropertyToBe ("mocks.2.invocations.length", 0)
        .expectingPropertyToBe ("mocks.3.invocations.length", 1)
        .commit ()
;


test.method (Service.TestService, "init")
    .should ("initalize the service and the plugins")
        .given (nit.new ("http.Server"))
        .before (function ()
        {
            const Plugin = nit.defineClass ("Plugin", "http.service.Plugin", true);

            this.plugin = new Plugin;
            this.class.servicePlugin (this.plugin);
        })
        .mock ("plugin", "onInit", function () {})
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;


test.method (Service.TestService, "start")
    .should ("start the service and the plugins")
        .given (nit.new ("http.Server"))
        .before (function ()
        {
            const Plugin = nit.defineClass ("Plugin", "http.service.Plugin", true);

            this.plugin = new Plugin;
            this.class.servicePlugin (this.plugin);
        })
        .mock ("plugin", "onStart", function () {})
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;


test.method (Service.TestService, "stop")
    .should ("stop the service and the plugins")
        .given (nit.new ("http.Server"))
        .before (function ()
        {
            const Plugin = nit.defineClass ("Plugin", "http.service.Plugin", true);

            this.plugin = new Plugin;
            this.class.servicePlugin (this.plugin);
        })
        .mock ("plugin", "onStop", function () {})
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;


test.method (Service.TestService, "upgrade")
    .should ("invoke plugins when the client request an upgrade")
        .given ("req", "socket", "head")
        .before (function ()
        {
            const Plugin = nit.defineClass ("Plugin", "http.service.Plugin", true);

            this.plugin = new Plugin;
            this.class.servicePlugin (this.plugin);
        })
        .mock ("plugin", "onUpgrade", function () {})
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.0.invocations.0.args", [{}, "req", "socket", "head"])
        .commit ()
;
