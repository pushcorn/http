test.method ("http.Descriptor", "defineRuntimeClass", true)
    .should ("define an exteded class that can be used at runtime")
        .given ("http.Certificate")
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "http.Certificate")
        .expectingPropertyToBe ("result.classChain.length", 4)
        .commit ()

    .given (nit.require ("http.Api"))
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "http.Api")
        .commit ()
;


test.method ("http.Descriptor", "build", true)
    .should ("build an instance of the described class")
        .up (s => s.class = nit.require ("http.Api.Descriptor"))
        .given ("http:get-api-spec")
        .returnsInstanceOf ("http.apis.GetApiSpec")
        .commit ()
;


test.method ("http.Descriptor", "createRuntimeClass")
    .should ("create the runtime class from the config")
        .project ("myapp")
        .up (s =>
        {
            s.class = s.http.Api.Descriptor;
            s.createArgs = { name: "myapp:hello", endpoint: "GET /users" };
        })
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "myapp.apis.Hello")
        .expectingPropertyToBe ("result.classChain.length", 7)
        .commit ()

    .reset ()
        .up (s =>
        {
            s.class = s.http.Api.Descriptor;
            s.createArgs = { endpoint: "GET /users" };
        })
        .after (s => s.conditions = s.result.getPlugins ("conditions"))
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "http.Api")
        .expectingPropertyToBe ("result.classChain.length", 6)
        .expectingPropertyToBe ("conditions.length", 0)
        .commit ()
;


test.method ("http.Descriptor", "build")
    .should ("create an instance of described target")
    .project ("myapp")
    .up (s =>
    {
        s.class = s.http.Api.Descriptor;
        s.createArgs = { name: "myapp:hello", endpoint: "GET /users" };
    })
    .after (s => s.conditions = s.result.constructor.getPlugins ("conditions"))
    .returnsInstanceOf ("myapp.apis.Hello")
    .expectingPropertyToBe ("result.constructor.classChain.length", 7)
    .expectingPropertyToBe ("conditions.length", 4)
    .expectingPropertyToBe ("conditions.1.path", "/users")
    .expectingPropertyToBe ("conditions.3.path", "/hello")
    .commit ()
;
