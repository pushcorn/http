const Context = nit.require ("http.Context");
const Request = nit.require ("http.Request")
    .staticGetter ("testClass", function ()
    {
        return this.defineSubclass (this.name, true);
    })
;


test.method (Request.testClass, "parameter", true)
    .should ("define a request parameter")
        .given ("id", "string", "The resource ID.")
        .returnsInstanceOf ("function")
        .expecting ("the id parameter has been defined", true, function (s)
        {
            return s.object.getField ("id").name == "id";
        })
        .commit ()
;


test.method (Request.testClass, "header", true)
    .should ("define a header parameter")
        .given ("accessToken", "string", "The access token.")
        .returnsInstanceOf ("function")
        .expecting ("the accessToken parameter has been defined", true, function (s)
        {
            let param = s.object.getField ("accessToken");

            return param
                && param.name == "accessToken"
                && param.source == "header"
            ;
        })
        .commit ()
;


test.method (Request.testClass, "path", true)
    .should ("define a path parameter")
        .given ("id", "string", "The resource ID.")
        .returnsInstanceOf ("function")
        .expecting ("the id parameter has been defined", true, function (s)
        {
            let param = s.object.getField ("id");

            return param
                && param.name == "id"
                && param.source == "path"
            ;
        })
        .commit ()
;


test.method (Request.testClass, "cookie", true)
    .should ("define a cookie parameter")
        .given ("id", "string", "The resource ID.")
        .returnsInstanceOf ("function")
        .expecting ("the id parameter has been defined", true, function (s)
        {
            let param = s.object.getField ("id");

            return param
                && param.name == "id"
                && param.source == "cookie"
            ;
        })
        .commit ()
;


test.method (Request.testClass, "form", true)
    .should ("define a form parameter")
        .given ("id", "string", "The resource ID.")
        .returnsInstanceOf ("function")
        .expecting ("the id parameter has been defined", true, function (s)
        {
            let param = s.object.getField ("id");

            return param
                && param.name == "id"
                && param.source == "form"
            ;
        })
        .commit ()
;


test.method (Request.testClass, "query", true)
    .should ("define a query parameter")
        .given ("id", "string", "The resource ID.")
        .returnsInstanceOf ("function")
        .expecting ("the id parameter has been defined", true, function (s)
        {
            let param = s.object.getField ("id");

            return param
                && param.name == "id"
                && param.source == "query"
            ;
        })
        .commit ()
;


test.method (Request.testClass, "build", true)
    .should ("build the request for the given context")
        .before (function (ctx)
        {
            this.class
                .path ("id", "string")
                .parameter ("a", "string")
            ;

            ctx.pathParser = nit.new ("http.PathParser", "/users/:id");
            ctx.readRequest ();
        })
        .given (Context.create ("GET", "/users/123?a=b"))
        .returnsInstanceOf ("http.Request")
        .expectingPropertyToBe ("result.id", "123")
        .expectingPropertyToBe ("result.a", "b")
        .commit ()
;
