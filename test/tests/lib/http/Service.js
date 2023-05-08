const http = nit.require ("http");
const Context = nit.require ("http.Context");
const Service = nit.require ("http.Service");


function newServiceClass ()
{
    return Service.defineSubclass (Service.name, true);
}


test.object (Service.ServicePlugin)
    .should ("define service lifecycle methods")
    .expectingPropertyToBeOfType ("class.prototype.preInit", "function")
    .expectingPropertyToBeOfType ("class.prototype.postInit", "function")
    .expectingPropertyToBeOfType ("class.prototype.preStart", "function")
    .expectingPropertyToBeOfType ("class.prototype.postStart", "function")
    .expectingPropertyToBeOfType ("class.prototype.preStop", "function")
    .expectingPropertyToBeOfType ("class.prototype.postStop", "function")
    .expectingPropertyToBeOfType ("class.prototype.preUpgrade", "function")
    .expectingPropertyToBeOfType ("class.prototype.postUpgrade", "function")
    .expectingPropertyToBeOfType ("class.prototype.preDispatch", "function")
    .expectingPropertyToBeOfType ("class.prototype.postDispatch", "function")
    .commit ()
;


test.object (newServiceClass (), true)
    .should ("provide a default context class")
    .expectingPropertyToBeOfType ("result.contextClass.prototype", http.Context)
    .commit ()
;


test.method (newServiceClass (), "init", true)
    .should ("register the init handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kInit])
    .commit ()
;


test.method (newServiceClass (), "start", true)
    .should ("register the start handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kStart])
    .commit ()
;


test.method (newServiceClass (), "stop", true)
    .should ("register the stop handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kStop])
    .commit ()
;


test.method (newServiceClass (), "upgrade", true)
    .should ("register the upgrade handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kUpgrade])
    .commit ()
;


test.method (newServiceClass (), "dispatch", true)
    .should ("register the dispatch handler")
    .given (nit.createFunction ("noop"))
    .returnsInstanceOf ("function")
    .expecting ("the handler is registered", true, (s) => s.args[0] == s.class[Service.kDispatch])
    .commit ()
;


test.method (newServiceClass (), "http.Service.dispatch", true)
    .should ("find a suitable middleware to run")
    .given (Context.create ("GET", "/two"))
    .before (function ()
    {
        let service = new this.class;

        const Middleware1 = http.defineMiddleware ("Middleware1", true)
            .condition ("http:request-path", "/one")
            .run (() =>
            {
                this.handledBy = "Middleware1";
            })
        ;

        const Middleware2 = http.defineMiddleware ("Middleware2", true)
            .condition ("http:request-path", "/two")
            .run (() =>
            {
                this.handledBy = "Middleware2";
            })
        ;

        service.middlewares = [new Middleware1, new Middleware2];

        this.class[Service.kDispatch] = this.class[Service.kDispatch].bind (service);
    })
    .expectingPropertyToBe ("handledBy", "Middleware2")
    .commit ()
;


test.method (newServiceClass (), "init")
    .should ("init the service")
    .before (function ()
    {
        const Plugin = Service.defineServicePlugin ("Plugin", true)
            .preInit (() => this.preInit = true)
            .postInit (() => this.postInit = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .init (() => this.initCalled = true)
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
        const Plugin = Service.defineServicePlugin ("Plugin", true)
            .preStart (() => this.preStart = true)
            .postStart (() => this.postStart = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .start (() => this.startCalled = true)
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
        const Plugin = Service.defineServicePlugin ("Plugin", true)
            .preStop (() => this.preStop = true)
            .postStop (() => this.postStop = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .stop (() => this.stopCalled = true)
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
        const Plugin = Service.defineServicePlugin ("Plugin", true)
            .preUpgrade (() => this.preUpgrade = true)
            .postUpgrade (() => this.postUpgrade = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .upgrade (() => this.upgradeCalled = true)
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
        const Plugin = Service.defineServicePlugin ("Plugin", true)
            .preDispatch (() => this.preDispatch = true)
            .postDispatch (() => this.postDispatch = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .dispatch (() => this.dispatchCalled = true)
        ;
    })
    .given (Context.create ())
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
        const Plugin = Service.defineServicePlugin ("Plugin", true)
            .preDispatch ((service, ctx) =>
            {
                ctx.send ("http:noop");

                this.preDispatch = true;
            })
            .postDispatch (() => this.postDispatch = true)
        ;

        this.class
            .serviceplugin (new Plugin)
            .dispatch (() => this.dispatchCalled = true)
        ;
    })
    .given (Context.create ())
    .returnsInstanceOf (Service)
    .expectingPropertyToBe ("preDispatch", true)
    .expectingPropertyToBe ("postDispatch", true)
    .expectingPropertyToBe ("dispatchCalled", undefined)
    .commit ()
;
