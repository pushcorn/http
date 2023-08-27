const http = nit.require ("http");
const Context = nit.require ("http.Context");
const Service = nit.require ("http.Service");


function newServiceClass ()
{
    return Service.defineSubclass (Service.name, true);
}


test.method (newServiceClass (), "onInit", true)
    .should ("register the init handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kInit])
    .commit ()
;


test.method (newServiceClass (), "onStart", true)
    .should ("register the start handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kStart])
    .commit ()
;


test.method (newServiceClass (), "onStop", true)
    .should ("register the stop handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kStop])
    .commit ()
;


test.method (newServiceClass (), "onUpgrade", true)
    .should ("register the upgrade handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kUpgrade])
    .commit ()
;


test.method (newServiceClass (), "onDispatch", true)
    .should ("register the dispatch handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kDispatch])
    .commit ()
;


test.method (newServiceClass (), "dispatch")
    .should ("find a suitable API to run")
        .given (Context.new ("GET", "/two"))
        .up (s =>
        {
            const Api1 = http.defineApi ("Api1", true)
                .condition ("http:request-path", "/one")
                .onRun (() =>
                {
                    s.handledBy = "Api1";
                })
            ;

            const Api2 = http.defineApi ("Api2", true)
                .condition ("http:request-path", "/two")
                .onRun (() =>
                {
                    s.handledBy = "Api2";
                })
            ;

            s.createArgs = { handlers: [new Api1, new Api2] };
        })
        .expectingPropertyToBe ("handledBy", "Api2")
        .commit ()

    .should ("find a suitable action to run")
        .given (Context.new ("GET", "/two"))
        .up (s =>
        {
            const Action1 = http.defineAction ("Action1", true)
                .condition ("http:request-path", "/one")
                .onRun (() =>
                {
                    s.handledBy = "Action1";
                })
            ;

            const Action2 = http.defineAction ("Action2", true)
                .condition ("http:request-path", "/two")
                .onRun (() =>
                {
                    s.handledBy = "Action2";
                })
            ;

            s.createArgs = { handlers: [new Action1, new Action2] };
        })
        .expectingPropertyToBe ("handledBy", "Action2")
        .commit ()

    .should ("do nothing if the no api or action can be used to handle the request")
        .given (Context.new ("GET", "/two"))
        .commit ()

    .should ("invoke the hook if defined")
        .given (Context.new ("GET", "/two"))
        .up (s =>
        {
            s.class.onDispatch (function ()
            {
                s.handledBy = "hook";
            });

            const Api1 = http.defineApi ("Api1", true)
                .condition ("http:request-path", "/one")
                .onRun (() =>
                {
                    s.handledBy = "Api1";
                })
            ;

            s.createArgs = { apis: [new Api1] };
        })
        .expectingPropertyToBe ("handledBy", "hook")
        .commit ()
;


test.method (newServiceClass (), "init")
    .should ("init the service")
    .before (function ()
    {
        const Plugin = http.defineServicePlugin ("Plugin", true)
            .onPreInit (() => this.preInit = true)
            .onPostInit (() => this.postInit = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .onInit (() => this.initCalled = true)
        ;
    })
    .given (new http.Server ())
    .returnsInstanceOf (Service)
    .expectingPropertyToBe ("preInit", true)
    .expectingPropertyToBe ("postInit", true)
    .expectingPropertyToBe ("initCalled", true)
    .commit ()
;


test.method (newServiceClass (), "start")
    .should ("start the service")
    .before (function ()
    {
        const Plugin = http.defineServicePlugin ("Plugin", true)
            .onPreStart (() => this.preStart = true)
            .onPostStart (() => this.postStart = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .onStart (() => this.startCalled = true)
        ;
    })
    .returnsInstanceOf (Service)
    .expectingPropertyToBe ("preStart", true)
    .expectingPropertyToBe ("postStart", true)
    .expectingPropertyToBe ("startCalled", true)
    .commit ()
;


test.method (newServiceClass (), "stop")
    .should ("stop the service")
    .before (function ()
    {
        const Plugin = http.defineServicePlugin ("Plugin", true)
            .onPreStop (() => this.preStop = true)
            .onPostStop (() => this.postStop = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .onStop (() => this.stopCalled = true)
        ;
    })
    .returnsInstanceOf (Service)
    .expectingPropertyToBe ("preStop", true)
    .expectingPropertyToBe ("postStop", true)
    .expectingPropertyToBe ("stopCalled", true)
    .commit ()
;


test.method (newServiceClass (), "upgrade")
    .should ("upgrade the service")
    .before (function ()
    {
        const Plugin = http.defineServicePlugin ("Plugin", true)
            .onPreUpgrade (() => this.preUpgrade = true)
            .onPostUpgrade (() => this.postUpgrade = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .onUpgrade (() => this.upgradeCalled = true)
        ;
    })
    .returnsInstanceOf (Service)
    .expectingPropertyToBe ("preUpgrade", true)
    .expectingPropertyToBe ("postUpgrade", true)
    .expectingPropertyToBe ("upgradeCalled", true)
    .commit ()
;


test.method (newServiceClass (), "dispatch")
    .should ("dispatch the request")
    .before (function ()
    {
        const Plugin = http.defineServicePlugin ("Plugin", true)
            .onPreDispatch (() => this.preDispatch = true)
            .onPostDispatch (() => this.postDispatch = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .onDispatch (() => this.dispatchCalled = true)
        ;
    })
    .given (Context.new ())
    .returnsInstanceOf (Service)
    .expectingPropertyToBe ("preDispatch", true)
    .expectingPropertyToBe ("postDispatch", true)
    .expectingPropertyToBe ("dispatchCalled", true)
    .commit ()
;


test.method (newServiceClass (), "dispatch")
    .should ("skip the dispatch callback if the response is set by a plugin")
    .before (function ()
    {
        const Plugin = http.defineServicePlugin ("Plugin", true)
            .onPreDispatch ((service, ctx) =>
            {
                ctx.send ("http:noop");

                this.preDispatch = true;
            })
            .onPostDispatch (() => this.postDispatch = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .onDispatch (() => this.dispatchCalled = true)
        ;
    })
    .given (Context.new ())
    .returnsInstanceOf (Service)
    .expectingPropertyToBe ("preDispatch", true)
    .expectingPropertyToBe ("postDispatch", true)
    .expectingPropertyToBe ("dispatchCalled", undefined)
    .commit ()
;


test.method ("http.Service.Descriptor", "build")
    .should ("build the service")
        .up (s =>
        {
            http.defineAction ("Test");

            s.createArgs =
            {
                hostnames: "app.pushcorn.com",
                conditions:
                {
                    name: "http:request-path",
                    options: "/api"
                }
                ,
                actions: "http:test",
                apis:
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
                requestFilters: "http:text-body-parser",
                responseFilters: "http:etag-builder"
            };
        })
        .after (s => s.serviceClass = s.result.constructor)
        .expectingPropertyToBe ("serviceClass.name", "http.Service")
        .expectingPropertyToBe ("serviceClass.conditions.length", 2)
        .expectingPropertyToBeOfType ("serviceClass.conditions.0", "http.conditions.Hostname")
        .expectingPropertyToBeOfType ("serviceClass.conditions.1", "http.conditions.RequestPath")
        .expectingPropertyToBe ("result.handlers.length", 2)
        .expectingPropertyToBeOfType ("result.handlers.0.constructor.conditions.0", "http.conditions.RequestContentType")
        .expectingPropertyToBe ("result.requestFilters.length", 1)
        .expectingPropertyToBe ("result.responseFilters.length", 1)
        .commit ()

    .should ("not add hostname conditions if not specified")
        .up (function ()
        {
            this.createArgs =
            {
                conditions:
                {
                    name: "http:request-path",
                    options: "/api"
                }
            };
        })
        .expectingPropertyToBe ("result.constructor.conditions.length", 1)
        .expectingPropertyToBeOfType ("result.constructor.conditions.0", "http.conditions.RequestPath")
        .commit ()
;
