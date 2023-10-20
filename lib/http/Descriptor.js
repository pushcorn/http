module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.Descriptor"))
        .categorize ("http.descriptors")
        .field ("[name]", "string", "The component name.")
        .field ("[options]", "any", "The component options.")

        .staticMethod ("defineRuntimeClass", function (superclass)
        {
            superclass = nit.lookupClass (superclass);

            return superclass.defineSubclass (superclass.name, true);
        })
        .staticMethod ("build", function ()
        {
            return new this (...arguments).build ();
        })
        .method ("createRuntimeClass", function ()
        {
            let self = this;
            let cls = self.constructor;
            let outerClass = cls.outerClass;
            let superclass = self.name ? nit.lookupComponent (self.name, nit.categoryName (outerClass), outerClass.name) : outerClass.name;

            return Self.defineRuntimeClass (superclass);
        })
        .lifecycleMethod ("configure")
        .lifecycleMethod ("build", function ()
        {
            let self = this;
            let cls = self.constructor;
            let result = cls[cls.kBuild]?.call (self);

            self.configure (result);

            return result;

        }, true)
    ;
};
