module.exports = function (nit)
{
    return nit.defineMixin ("http.mixins.Describable")
        .excludeStaticProperties ("Descriptor")

        .staticMethod ("defineDescriptor", function (superclass, builder)
        {
            ({ superclass = "http.Descriptor", builder } = nit.typedArgsToObj (arguments,
            {
                superclass: "string",
                builder: "function"
            }));

            return this.defineInnerClass ("Descriptor", superclass, builder);
        })
        .staticMethod ("defineClassDescriptor", function (builder)
        {
            return this.defineDescriptor ("http.descriptors.Class", builder);
        })
        .staticMethod ("defineInstanceDescriptor", function (builder)
        {
            return this.defineDescriptor ("http.descriptors.Instance", builder);
        })
    ;
};
