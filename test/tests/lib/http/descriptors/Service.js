test.method ("http.descriptors.Service", "configure")
    .should ("build the service and add it to the server")
    .up (function ()
    {
        this.createArgs =
        {
            hostnames: "app.pushcorn.com",
            conditions:
            {
                name: "http:request-path",
                options: "/api"
            }
            ,
            plugins: "http:file-server",
            middlewares:
            [
            {
                conditions:
                {
                    name: "http:request-content-type",
                    options: "text/*"
                }
            }
            ]
            ,
            requestfilters: "http:text-body-parser",
            responsefilters: "http:etag-builder"
        };
    })
    .given (nit.new ("http.Server"))
    .expectingPropertyToBe ("args.0.services.0.constructor.name", "http.services.Default$1")
    .expectingPropertyToBe ("args.0.services.0.constructor.conditions.length", 2)
    .expectingPropertyToBeOfType ("args.0.services.0.constructor.conditions.0", "http.conditions.Hostname")
    .expectingPropertyToBeOfType ("args.0.services.0.constructor.conditions.1", "http.conditions.RequestPath")
    .expectingPropertyToBeOfType ("args.0.services.0.constructor.serviceplugins.0", "http.serviceplugins.FileServer")
    .expectingPropertyToBe ("args.0.services.0.middlewares.length", 1)
    .expectingPropertyToBeOfType ("args.0.services.0.middlewares.0.constructor.conditions.0", "http.conditions.RequestContentType")
    .expectingPropertyToBeOfType ("args.0.services.0.contextClass.prototype", nit.require ("http.Context"))
    .expectingPropertyToBe ("args.0.services.0.contextClass.requestfilters.length", 1)
    .expectingPropertyToBe ("args.0.services.0.contextClass.responsefilters.length", 1)
    .commit ()
;
