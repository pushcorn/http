test.method ("http.descriptors.Server", "configure",
    {
        createArgs:
        {
            requestfilters: ["http:text-body-parser"],
            responsefilters: ["http:css-compiler"],
            services: ["http:file-server"],
            certificates:
            {
                cert: "pushcorn.com.crt",
                key: "pushcorn.com.key"
            }
        }
    })
    .should ("configure the server with the defined descriptor")
    .given (nit.new ("http.Server"))
    .expectingPropertyToBe ("args.0.certificates.length", 1)
    .expectingPropertyToBe ("args.0.services.length", 1)
    .expectingPropertyToBe ("args.0.contextClass.requestfilters.length", 1)
    .expectingPropertyToBe ("args.0.contextClass.responsefilters.length", 1)
    .commit ()
;
