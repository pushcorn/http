const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");


test.object ("http.Certificate")
    .should ("provide the secureContext for the given cert files")
    .given (
        CERTS_DIR.join ("pushcorn.com.crt"),
        CERTS_DIR.join ("pushcorn.com.key"),
        CERTS_DIR.join ("ca.pushcorn.com.crt")
    )
    .expectingPropertyToBeOfType ("result.secureContext", "http.SecureContext")
    .commit ()
;


test.method ("http.Certificate.Descriptor", "build",
    {
        createArgs:
        {
            hostnames: "app.pushcorn.com",
            options:
            {
                cert: "pushcorn.com.crt",
                key: "pushcorn.com.key",
                ca: "ca.pushcorn.com.crt"
            }
        }
    })
    .should ("build a certificate and add it the server")
    .given (nit.new ("http.Server"))
    .expectingPropertyToBe ("result.constructor.name", "http.Certificate")
    .expectingPropertyToBe ("result.cert.path", "pushcorn.com.crt")
    .expectingPropertyToBeOfType ("result.constructor.conditions.0", "http.conditions.Hostname")
    .commit ()
;


test.method ("http.Certificate.Descriptor", "build",
    {
        createArgs:
        {
            options:
            {
                cert: "pushcorn.com.crt",
                key: "pushcorn.com.key",
                ca: "ca.pushcorn.com.crt"
            }
        }
    })
    .should ("build a certificate without hostname conditions if it was not specified")
    .given (nit.new ("http.Server"))
    .expectingPropertyToBe ("result.constructor.name", "http.Certificate")
    .expectingPropertyToBe ("result.cert.path", "pushcorn.com.crt")
    .expectingPropertyToBe ("result.constructor.conditions.length", 0)
    .commit ()
;
