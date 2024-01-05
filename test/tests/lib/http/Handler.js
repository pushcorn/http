test.method ("http.Handler", "dispatch")
    .should ("dispatch the handler")
        .up (s => s.called = [])
        .up (s => s.http.defineHandlerPlugin ("TestPlugin")
            .onPreDispatch (() => s.called.push ("preDispatchPlugin"))
            .onDispatch (() => s.called.push ("dispatchPlugin"))
            .onPostDispatch (() => s.called.push ("postDispatchPlugin"))
        )
        .up (s => s.class = s.http.defineHandler ("Controller")
            .handlerplugin ("http:test-plugin")
            .onDispatch (() => s.called.push ("dispatchHandler"))
            .onPreDispatch (() => s.called.push ("preDispatchHandler"))
            .onPostDispatch (() => s.called.push ("postDispatchHandler"))
        )
        .givenContext ()
        .expectingPropertyToBe ("called",
        [
            "preDispatchHandler",
            "preDispatchPlugin",
            "dispatchHandler",
            "dispatchPlugin",
            "postDispatchHandler",
            "postDispatchPlugin"
        ])
        .expectingPropertyToBeOfType ("result.parent", "http.Context")
        .commit ()

    .should ("use the provided context if it's an instance of Handler.Context")
        .up (s => s.called = [])
        .up (s => s.class = s.http.defineHandler ("Controller")
            .onDispatch (() => s.called.push ("dispatchHandler"))
            .onPreDispatch (() => s.called.push ("preDispatchHandler"))
            .onPostDispatch (() => s.called.push ("postDispatchHandler"))
        )
        .up (s => s.args = s.class.Context.new (s.Context.new ()))
        .expectingPropertyToBe ("called",
        [
            "preDispatchHandler",
            "dispatchHandler",
            "postDispatchHandler"
        ])
        .commit ()

    .should ("throw if onDispatch throws")
        .up (s => s.class = s.http.defineHandler ("Controller")
            .onDispatch (() => { throw new Error ("ERR!"); })
        )
        .givenContext ()
        .throws ("ERR!")
        .commit ()
;


test.method ("http.Handler", "endpoint", true)
    .should ("update the request method and path conditions")
        .up (s => s.class = s.class.defineSubclass ("test.handlers.Handler1"))
        .expectingPropertyToBe ("class.requestMethod", "GET")
        .expectingPropertyToBe ("class.requestPath", "/test/handler1")
        .commit ()

    .should ("pluralize the last path component when needed")
        .up (s => s.class = s.class.defineSubclass ("test.handlers.CreateJob"))
        .expectingPropertyToBe ("class.requestMethod", "POST")
        .expectingPropertyToBe ("class.requestPath", "/test/jobs")
        .commit ()
;


test.object ("http.Handler", false)
    .should ("add endpoint automatically when onDispatch () is defined but endpoint () was not called")
        .project ("myapp", true)
        .up (s => s.class = nit.lookupClass ("myapp.apis.AutoPath"))
        .expectingPropertyToBe ("class.requestMethod", "GET")
        .expectingPropertyToBe ("class.requestPath", "/myapp/auto-path")
        .commit ()
;


test.object ("http.Handler")
    .should ("add instance level endpoint if specified")
        .given ({ endpoint: "GET /users" })
        .expectingPropertyToBe ("instance.requestMethod", "GET")
        .expectingPropertyToBe ("instance.requestPath", "/users")
        .expectingPropertyToBe ("instance.conditions.length", 2)
        .expectingPropertyToBeOfType ("instance.conditions.0", "http.conditions.RequestMethod")
        .expectingPropertyToBeOfType ("instance.conditions.1", "http.conditions.RequestPath")
        .expectingMethodToReturnValue ("instance.applicableTo", { method: "GET", path: "/people" }, false)
        .expectingMethodToReturnValue ("instance.applicableTo", { method: "GET", path: "/users" }, true)
        .commit ()
;


test.method ("http.Handler", "applicableTo")
    .should ("return true if the context satisfy the specified conditions")
        .up (s => s.class = s.class.defineSubclass ("MyHandler")
            .endpoint ("GET /users")
        )
        .given ({ method: "GET", path: "/users" })
        .returns (true)
        .expectingPropertyToBe ("object.requestMethod", "")
        .expectingPropertyToBe ("class.conditions.length", 2)
        .commit ()

    .should ("return false if the context does not satisfy the specified conditions")
        .up (s => s.class = s.class.defineSubclass ("MyHandler")
            .endpoint ("POST", "/users")
        )
        .given ({ method: "POST", path: "/people" })
        .returns (false)
        .commit ()
;


test.method ("http.Handler", "endpoint", true)
    .should ("try to figure out the method by checking the handler's prefix")
        .up (s => s.class = s.class.defineSubclass ("CreateUser"))
        .expectingPropertyToBe ("class.requestMethod", "POST")
        .expectingPropertyToBe ("class.requestPath", "/users")
        .commit ()

    .reset ()
        .up (s => s.class = s.class.defineSubclass ("UpdateUser")
            .defineRequest (Request =>
                Request
                    .path ("id")
                    .form ("firstname")
            )
        )
        .expectingPropertyToBe ("class.requestMethod", "PUT")
        .expectingPropertyToBe ("class.requestPath", "/users/:id")
        .commit ()
;
