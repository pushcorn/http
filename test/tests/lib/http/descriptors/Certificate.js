test.method ("http.descriptors.Certificate", "configure",
    {
        createArgs:
        {
            cert: "pushcorn.com.crt",
            key: "pushcorn.com.key",
            ca: "ca.pushcorn.com.crt",
            hostnames: "app.pushcorn.com"
        }
    })
    .should ("build a certificate and add it the server")
    .given (nit.new ("http.Server"))
    .expectingPropertyToBe ("args.0.certificates.0.constructor.name", "Certificate$1")
    .expectingPropertyToBe ("args.0.certificates.0.cert.path", "pushcorn.com.crt")
    .expectingPropertyToBeOfType ("args.0.certificates.0.constructor.conditions.0", "http.conditions.Hostname")
    .commit ()
;


test.method ("http.descriptors.Certificate", "configure",
    {
        createArgs:
        {
            cert: "pushcorn.com.crt",
            key: "pushcorn.com.key",
            ca: "ca.pushcorn.com.crt"
        }
    })
    .should ("build a certificate without hostname conditions if it was not specified")
    .given (nit.new ("http.Server"))
    .expectingPropertyToBe ("args.0.certificates.0.constructor.name", "Certificate$2")
    .expectingPropertyToBe ("args.0.certificates.0.cert.path", "pushcorn.com.crt")
    .expectingPropertyToBe ("args.0.certificates.0.constructor.conditions.length", 0)
    .commit ()
;
