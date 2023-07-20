module.exports = function (nit, http)
{
    return http.defineConditional ("http.Certificate")
        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .field ("hostnames...", "string", "The hostnames for which the certificate can be used.")
                .onConfigure (function (certificate)
                {
                    let self = this;
                    let certificateClass = certificate.constructor;

                    if (self.hostnames.length)
                    {
                        certificateClass.condition ("http:hostname", ...self.hostnames);
                    }
                })
            ;
        })

        .field ("<cert>", "nit.File", "The path of the SSL certificate.")
        .field ("<key>", "nit.File", "The path of the SSL private key.")
        .field ("[ca]", "nit.File", "The path of the CA cert.")

        .memo ("secureContext", function ()
        {
            return http.createSecureContext (this.cert, this.key, this.ca);
        })
    ;
};
