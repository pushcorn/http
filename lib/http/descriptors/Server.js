module.exports = function (nit)
{
    let seq = 1;

    return nit.defineClass ("http.descriptors.Server")
        .field ("contextClass", "string", "The server context class.", "http.Server.Context")
            .constraint ("subclass", "http.Context", true)
        .field ("services...", "http.descriptors.Service")
        .field ("certificates...", "http.descriptors.Certificate", "The SSL certificates.")
        .field ("requestfilters...", "http.descriptors.Component", "The request filters.")
        .field ("responsefilters...", "http.descriptors.Component", "The response filters.")

        .method ("configure", function (server)
        {
            let self = this;

            server.contextClass = nit.lookupClass (self.contextClass).defineSubclass (self.contextClass + "$" + seq++, true);
            self.requestfilters.forEach (f => server.contextClass.requestfilter (f.name, f.options));
            self.responsefilters.forEach (f => server.contextClass.responsefilter (f.name, f.options));
            self.services.forEach (s => s.configure (server));
            self.certificates.forEach (c => c.configure (server));
        })
    ;
};
