test.method ("http.Host.Descriptor", "build")
    .should ("build a host object")
        .up (s =>
        {
            s.createArgs =
            {
                names: "app.pushcorn.com",
                services: "http:file-server",
                requestFilters: "http:json-body-parser",
                responseFilters: "http:body-compressor",
                certificate:
                {
                    cert: "pushcorn.com.crt",
                    key: "pushcorn.com.key",
                    ca: "ca.pushcorn.com.crt"
                }
            };
        })
        .returnsInstanceOf ("http.Host")
        .expectingPropertyToBe ("result.constructor.conditions.length", 1)
        .expectingPropertyToBe ("result.names", ["app.pushcorn.com"])
        .expectingPropertyToBeOfType ("result.certificate", "http.Certificate")
        .expectingPropertyToBeOfType ("result.requestFilters.0", "http.requestfilters.JsonBodyParser")
        .expectingPropertyToBeOfType ("result.responseFilters.0", "http.responsefilters.BodyCompressor")
        .expectingPropertyToBeOfType ("result.services.0", "http.services.FileServer")
        .expectingPropertyToBe ("result.name", "app.pushcorn.com")
        .commit ()

    .reset ()
        .up (s =>
        {
            s.createArgs =
            {
                services: "http:file-server",
                requestFilters: "http:json-body-parser",
                responseFilters: "http:body-compressor",
                certificate:
                {
                    cert: "pushcorn.com.crt",
                    key: "pushcorn.com.key",
                    ca: "ca.pushcorn.com.crt"
                }
            };
        })
        .returnsInstanceOf ("http.Host")
        .expectingPropertyToBe ("result.constructor.conditions.length", 0)
        .expectingPropertyToBe ("result.name", "")
        .commit ()
;


test.method ("http.Host", "init")
    .should ("initialize the services")
    .before (s =>
    {
        const Service = s.http.defineService ("TestService")
            .onInit (function ()
            {
                this.initArgs = nit.array (arguments);
                this.initCalled = true;
            })
        ;

        s.object.services.push (new Service ());
    })
    .given (nit.new ("http.Server"))
    .returns ()
    .expectingPropertyToBe ("object.services.0.initCalled", true)
    .expectingPropertyToBeOfType ("object.services.0.initArgs.0", "http.Server")
    .commit ()
;


test.method ("http.Host", "upgrade")
    .should ("invoke services' upgrade method")
    .before (s =>
    {
        const Service = s.http.defineService ("TestService")
            .onUpgrade (function ()
            {
                this.upgradeArgs = nit.array (arguments);
                this.upgradeCalled = true;
            })
        ;

        s.object.services.push (new Service ());
    })
    .given (1, 2, 3)
    .returns ()
    .expectingPropertyToBe ("object.services.0.upgradeCalled", true)
    .expectingPropertyToBe ("object.services.0.upgradeArgs", [1, 2, 3])
    .commit ()
;


test.method ("http.Host", "start")
    .should ("invoke services' start method")
    .before (s =>
    {
        const Service = s.http.defineService ("TestService")
            .onStart (function ()
            {
                this.startArgs = nit.array (arguments);
                this.startCalled = true;
            })
        ;

        s.object.services.push (new Service ());
    })
    .given (1, 2, 3)
    .returns ()
    .expectingPropertyToBe ("object.services.0.startCalled", true)
    .expectingPropertyToBe ("object.services.0.startArgs", [])
    .commit ()
;


test.method ("http.Host", "stop")
    .should ("invoke services' stop method")
    .before (s =>
    {
        const Service = s.http.defineService ("TestService")
            .onStop (function ()
            {
                this.stopArgs = nit.array (arguments);
                this.stopCalled = true;
            })
        ;

        s.object.services.push (new Service ());
    })
    .given (1, 2, 3)
    .returns ()
    .expectingPropertyToBe ("object.services.0.stopCalled", true)
    .expectingPropertyToBe ("object.services.0.stopArgs", [])
    .commit ()
;


test.method ("http.Host", "dispatch")
    .should ("invoke services' dispatch method")
    .before (s =>
    {
        const Service = s.http.defineService ("TestService")
            .onDispatch (function ()
            {
                this.dispatchArgs = nit.array (arguments);
                this.dispatchCalled = true;
            })
        ;

        s.object.services.push (new Service ());
    })
    .given (nit.require ("http.Context").new ("GET", "/"))
    .returns ()
    .expectingPropertyToBe ("object.services.0.dispatchCalled", true)
    .expectingPropertyToBe ("object.services.0.dispatchArgs.length", 1)
    .expectingPropertyToBeOfType ("object.services.0.dispatchArgs.0", "http.Context")
    .commit ()
;
