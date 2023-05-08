const http = nit.require ("http");


test.object ("http.middlewares.Default")
    .should ("be an instance of http.Middleware")
    .returnsInstanceOf (http.Middleware)
    .expectingPropertyToBe ("class.simpleName", "Default")
    .commit ()
;


