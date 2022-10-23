const http = nit.require ("http");


test.object ("http.mocks.IncomingMessage")
    .should ("be an instance of http.IncomingMessage")
    .given ("GET", "/users/")
    .expecting ("the object is an instance of http.IncomingMessage", true, s => s.result instanceof http.IncomingMessage)
    .expectingPropertyToBe ("result.path", "/users")
    .commit ()
;
