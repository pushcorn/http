module.exports = function (nit)
{
    let seq = 1;

    return nit.defineClass ("http.descriptors.Certificate")
        .field ("<cert>", "nit.File", "The path of the SSL certificate.")
        .field ("<key>", "nit.File", "The path of the SSL private key.")
        .field ("[ca]", "nit.File", "The path of the CA cert.")
        .field ("hostnames...", "string", "The hostnames for which the certificate can be used.")

        .method ("configure", function (server)
        {
            let self = this;

            const Certificate = nit.defineClass ("Certificate$" + seq++, "http.Certificate", true);

            if (self.hostnames.length)
            {
                Certificate.condition ("http:hostname", ...self.hostnames);
            }

            server.certificates.push (new Certificate (self.toPojo ()));
        })
    ;
};
