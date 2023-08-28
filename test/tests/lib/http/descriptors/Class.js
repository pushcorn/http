const Context = nit.defineClass ("test.Context")
    .mixin ("http:describable")
    .defineClassDescriptor (Descriptor =>
    {
        Descriptor
            .field ("req", "object?", "The request")
        ;
    })
;


test.method ("http.descriptors.Class", "build")
    .should ("return the runtime class")
    .up (s =>
    {
        s.class = Context.Descriptor;
    })
    .returnsInstanceOf (Function)
    .expectingPropertyToBe ("result.name", "test.Context")
    .expectingPropertyToBe ("result.classChain.length", 4)
    .commit ()
;
