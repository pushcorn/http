module.exports = function (nit, http)
{
    return nit.defineClass ("http.Certificate")
        .mixin ("http:describable")
        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .meta ("fieldsAsOptions", true)
                .field ("cert", "file", "The path of the SSL certificate.")
                .field ("key", "file", "The path of the SSL private key.")
                .field ("ca", "file?", "The path of the CA cert.")
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
