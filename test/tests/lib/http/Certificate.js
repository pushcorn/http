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
