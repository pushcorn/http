test.method ("http.mixins.Describable", "defineDescriptor", true)
    .should ("define a class descriptor")
        .before (s =>
        {
            s.object = nit.defineClass ("A")
                .mixin (s.class)
            ;
        })
        .expectingPropertyToBeOfType ("result.Descriptor", "http.Descriptor", true)
        .commit ()
;


test.method ("http.mixins.Describable", "defineClassDescriptor", true)
    .should ("define a class descriptor")
    .reset ()
        .before (s =>
        {
            s.object = nit.defineClass ("B")
                .mixin (s.class)
            ;
        })
        .expectingPropertyToBeOfType ("result.Descriptor", "http.descriptors.Class", true)
        .commit ()
;


test.method ("http.mixins.Describable", "defineInstanceDescriptor", true)
    .should ("define a class descriptor")
    .reset ()
        .before (s =>
        {
            s.object = nit.defineClass ("C")
                .mixin (s.class)
            ;
        })
        .expectingPropertyToBeOfType ("result.Descriptor", "http.descriptors.Instance", true)
        .commit ()
;
