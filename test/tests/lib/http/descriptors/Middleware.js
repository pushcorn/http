test.method ("http.descriptors.Middleware", "configure")
    .should ("build the middleware and add it to the service")
        .given (nit.new ("http.Service"))
        .commit ()

    .should ("add the conditions for the specified endpoint")
        .given (nit.new ("http.Service"))
        .up (function ()
        {
            this.createArgs = { endpoint: "POST /items" };
        })
        .expectingPropertyToBe ("args.0.middlewares.0.constructor.conditions.length", 2)
        .expectingPropertyToBe ("args.0.middlewares.0.constructor.conditions.0.methods", ["POST"])
        .expectingPropertyToBe ("args.0.middlewares.0.constructor.conditions.1.path", "/items")
        .commit ()

    .should ("add the specified conditions and plugins to the middleware")
        .given (nit.new ("http.Service"))
        .up (function ()
        {
            const Middleware = nit.require ("http.Middleware");

            Middleware.defineMiddlewarePlugin ("Counter");

            this.createArgs =
            {
                conditions:
                [
                {
                    name: "http:hostname",
                    options: "app.pushcorn.com"
                }
                ]
                ,
                plugins: ["http:counter"]
            };
        })
        .expectingPropertyToBe ("args.0.middlewares.0.constructor.conditions.length", 1)
        .expectingPropertyToBe ("args.0.middlewares.0.constructor.conditions.0.hostnames", ["app.pushcorn.com"])
        .expectingPropertyToBe ("args.0.middlewares.0.constructor.middlewareplugins.length", 1)
        .commit ()
;
