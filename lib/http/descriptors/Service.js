module.exports = function (nit)
{
    let seq = 1;

    return nit.defineClass ("http.descriptors.Service", "http.descriptors.Component")
        .defaults ("name", "http:default")
        .field ("hostnames...", "string", "The hostnames of the requests that the service should handle.")
        .field ("contextClass", "string", "The service context class.")
            .constraint ("subclass", "http.Context", true)
        .field ("conditions...", "http.descriptors.Component", "The conditions to check.")
        .field ("plugins...", "http.descriptors.Component", "The service plugins to use.")
        .field ("middlewares...", "http.descriptors.Middleware", "The middlewares to handle requests.")
        .field ("requestfilters...", "http.descriptors.Component", "The request filters.")
        .field ("responsefilters...", "http.descriptors.Component", "The response filters.")

        .method ("configure", function (server)
        {
            let self = this;

            const superclass = nit.lookupComponent (self.name, "services", "http.Service");
            const subclass = superclass.defineSubclass (superclass.name + "$" + seq++, true);

            let service = nit.new (subclass, self.options);

            if (self.hostnames.length)
            {
                subclass.condition ("http:hostname", ...self.hostnames);
            }

            self.conditions.forEach (d => subclass.condition (d.name, d.options));
            self.plugins.forEach (d => subclass.serviceplugin (d.name, d.options));
            self.middlewares.forEach (d => d.configure (service, server));

            service.contextClass = (nit.lookupClass (self.contextClass) || server.contextClass).defineSubclass (subclass.name + ".Context", true);
            self.requestfilters.forEach (d => service.contextClass.requestfilter (d.name, d.options));
            self.responsefilters.forEach (d => service.contextClass.responsefilter (d.name, d.options));

            server.services.push (service);
        })
    ;
};
