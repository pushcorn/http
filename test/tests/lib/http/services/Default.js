const http = nit.require ("http");


test.object ("http.services.Default")
    .should ("be an instance of http.Service")
    .returnsInstanceOf (http.Service)
    .expectingPropertyToBe ("class.simpleName", "Default")
    .commit ()
;


