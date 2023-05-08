module.exports = function (nit)
{
    let seq = 1;

    return nit.defineClass ("http.descriptors.Middleware", "http.descriptors.Component")
        .defaults ("name", "http:default")
        .field ("endpoint", "string", "The endpoint that the middleware should handle.")
        .field ("conditions...", "http.descriptors.Component", "The conditions to check.")
        .field ("plugins...", "http.descriptors.Component", "The plugins to use.")

        .method ("configure", function (service)
        {
            let self = this;

            const superclass = nit.lookupComponent (self.name, "middlewares", "http.Middleware");
            const subclass = superclass.defineSubclass (superclass.name + "$" + seq++, true);

            if (self.endpoint)
            {
                subclass.endpoint (...nit.kvSplit (self.endpoint));
            }

            self.conditions.forEach (d => subclass.condition (d.name, d.options));
            self.plugins.forEach (d => subclass.middlewareplugin (d.name, d.options));

            service.middlewares.push (nit.new (subclass, self.options));
        })
    ;
};
