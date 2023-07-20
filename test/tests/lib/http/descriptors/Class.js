test.method ("http.descriptors.Class", "build")
    .should ("return the runtime class")
    .project ("myapp")
    .up (s =>
    {
        s.class = s.http.Context.Descriptor;
    })
    .returnsInstanceOf (Function)
    .expectingPropertyToBe ("result.name", "http.Context")
    .expectingPropertyToBe ("result.classChain.length", 4)
    .commit ()
;
