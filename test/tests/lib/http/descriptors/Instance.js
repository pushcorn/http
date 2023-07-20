test.method ("http.descriptors.Instance", "build")
    .should ("return the runtime class")
    .project ("myapp")
    .up (s =>
    {
        s.class = s.http.Api.Descriptor;
        s.createArgs = { name: "myapp:hello" };
    })
    .returnsInstanceOf ("myapp.apis.Hello")
    .expectingPropertyToBe ("result.constructor.classChain.length", 6)
    .commit ()
;
