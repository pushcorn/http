module.exports = function (nit, http)
{
    return http.defineConditional ("http.Certificate")
        .field ("<cert>", "nit.File", "The path of the SSL certificate.")
        .field ("<key>", "nit.File", "The path of the SSL private key.")
        .field ("[ca]", "nit.File", "The path of the CA cert.")

        .memo ("secureContext", function ()
        {
            return http.createSecureContext (this.cert, this.key, this.ca);
        })
    ;
};
