const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");


test.method ("http.descriptors.Instance", "build")
    .should ("return the runtime class")
        .project ("myapp")
        .up (s =>
        {
            s.class = s.http.Api.Descriptor;
            s.createArgs = { name: "myapp:hello" };
        })
        .returnsInstanceOf ("myapp.apis.Hello")
        .expectingPropertyToBe ("result.constructor.classChain.length", 7)
        .commit ()

    .should ("copy descriptor fields to options if fieldsAsOptions is true")
        .project ("myapp")
        .up (s =>
        {
            s.class = s.http.Certificate.Descriptor;
            s.createArgs =
            {
                cert: CERTS_DIR.join ("pushcorn.com.crt"),
                key: CERTS_DIR.join ("pushcorn.com.key")
            };
        })
        .returnsInstanceOf ("http.Certificate")
        .expectingPropertyToBe ("result.constructor.classChain.length", 4)
        .expectingPropertyToBe ("result.cert.path", CERTS_DIR.join ("pushcorn.com.crt"))
        .commit ()
;
