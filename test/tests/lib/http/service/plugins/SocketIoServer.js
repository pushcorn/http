const SocketIoServer = nit.require ("http.service.plugins.SocketIoServer");
const MockIncomingMessage = nit.require ("http.mocks.IncomingMessage");
const MockServerResponse = nit.require ("http.mocks.ServerResponse");
const no_http = require ("http");

nit.defineClass ("handlers.TestHandler", "http.Handler")
    .run (function (ctx) // eslint-disable-line no-unused-vars
    {
    })
;


function createTestService ()
{
    return nit.do (nit.defineClass ("TestService", "http.Service", true), SocketIoServer.onUsePlugin);
}


test.method ("http.service.plugins.SocketIoServer.Manager", "shouldHandleRequest")
    .should ("return %{result} if (path, req.path) = (%{createArgs.1}, %{args[0].path}")
        .init (s => s.createArgs = [no_http.createServer (), "/sio"])
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io"))
        .returns (false)
        .commit ()

    .init (s => s.createArgs = [no_http.createServer (), "/socket.io"])
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"))
        .returns (true)
        .commit ()
;


test.method ("http.service.plugins.SocketIoServer.Manager", "handleRequest")
    .should ("handle the request if possible")
        .init (s => s.createArgs = [no_http.createServer (), "/socket.io"])
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"))
        .mock ("object.io.engine", "handleRequest")
        .returns (true)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("return false if the request is not for socket.io")
        .init (s => s.createArgs = [no_http.createServer (), "/sio"])
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"))
        .mock ("object.io.engine", "handleRequest")
        .returns (false)
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()
;


test.method ("http.service.plugins.SocketIoServer.Manager", "handleUpgrade")
    .should ("handle the request if possible")
        .init (s => s.createArgs = [no_http.createServer (), "/socket.io"])
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"))
        .mock ("object.io.engine", "handleUpgrade")
        .returns (true)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("return false if the request is not for socket.io")
        .init (s => s.createArgs = [no_http.createServer (), "/sio"])
        .given (
            nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"),
            { writable: false }
        )
        .mock ("object.io.engine", "handleUpgrade")
        .returns (false)
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()

    .should ("return false if the request is not for socket.io")
        .init (s => s.createArgs = [no_http.createServer (), "/sio"])
        .given (
            nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"),
            { writable: true, bytesWritten: 0, end: nit.noop }
        )
        .mock ("object.io.engine", "handleUpgrade")
        .mock ("args.1", "end")
        .returns (false)
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()
;


test.method ("http.service.plugins.SocketIoServer", "onUsePlugin", true)
    .should ("add various methods to the service")
    .given (createTestService ())
    .commit ()
;


test.method (createTestService (), "socketEndpoint", true)
    .should ("add an endpoint")
    .given ("GET", "/users", "handlers.TestHandler")
    .returnsInstanceOf ("function")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.method", "GET")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.path", "/users")
    .expectingPropertyToBeOfType ("class.socketEndpoints.0.handler", "handlers.TestHandler")
    .commit ()
;


test.method (createTestService (), "soGet", true)
    .should ("add a GET endpoint")
    .given ("/users", "handlers.TestHandler")
    .returnsInstanceOf ("function")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.method", "GET")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.path", "/users")
    .expectingPropertyToBeOfType ("class.socketEndpoints.0.handler", "handlers.TestHandler")
    .commit ()
;


test.method (createTestService (), "soPost", true)
    .should ("add a POST endpoint")
    .given ("/users", nit.noop)
    .returnsInstanceOf ("function")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.method", "POST")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.path", "/users")
    .expectingPropertyToBeOfType ("class.socketEndpoints.0.handler", "FuncHandler")
    .commit ()
;


test.method (createTestService (), "soPut", true)
    .should ("add a PUT endpoint")
    .given ("/users/:id", nit.noop)
    .returnsInstanceOf ("function")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.method", "PUT")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.path", "/users/:id")
    .expectingPropertyToBeOfType ("class.socketEndpoints.0.handler", "FuncHandler")
    .commit ()
;


test.method (createTestService (), "soDelete", true)
    .should ("add a DELETE endpoint")
    .given ("/users/:id", nit.noop)
    .returnsInstanceOf ("function")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.method", "DELETE")
    .expectingPropertyToBe ("class.socketEndpoints.0.route.path", "/users/:id")
    .expectingPropertyToBeOfType ("class.socketEndpoints.0.handler", "FuncHandler")
    .commit ()
;


test.method (createTestService (), "dispatchSocketRequest")
    .should ("dispatch the socket request")
        .given (new MockIncomingMessage ("GET", "/users"), new MockServerResponse)
        .before (function ()
        {
            this.class.soGet ("/users", ctx =>
            {
                ctx.response = nit.new ("http.responses.RequestSucceeded");
            });
        })
        .returnsInstanceOf ("TestService.Context")
        .expectingPropertyToBeOfType ("result.response", "http.responses.RequestSucceeded")
        .commit ()

    .given (new MockIncomingMessage ("POST", "/users"), new MockServerResponse)
        .returnsInstanceOf ("TestService.Context")
        .expectingPropertyToBeOfType ("result.response", "http.responses.NotFound")
        .commit ()
;


test.method ("http.service.plugins.SocketIoServer", "preDispatch")
    .should ("set context.writeEnabled to false if socket.io will handle the request")
        .given (
            { socketIo: { handleRequest: function () { return true; } } },
            {}
        )
        .expectingPropertyToBe ("args.1.writeEnabled", false)
        .commit ()

    .should ("not update context.writeEnabled if socket.io will not handle the request")
        .given (
            { socketIo: { handleRequest: function () { return false; } } },
            {}
        )
        .expectingPropertyToBe ("args.1.writeEnabled")
        .commit ()
;


test.method ("http.service.plugins.SocketIoServer", "onInit")
    .should ("initialize the service's socketIo property")
    .given (nit.do (createTestService () (), srv =>
    {
        srv.server = nit.new ("http.Server");
        srv.server.nodeServer = no_http.createServer ();

        srv.constructor.soGet ("/ping", ctx =>
        {
            ctx.response = nit.new ("http.responses.RequestSucceeded");
        });
    }))
    .spy ("args.0", "dispatchSocketRequest")
    .after (async function (service)
    {
        this.socket =
        {
            on: (evt, cb) =>
            {
                this.onMessage = cb;
            }
        };

        this.onConnection = service.socketIo.io.listeners ("connection")[0];
        this.onConnection (this.socket);

        await this.onMessage ("GET", "/ping", { m: "hello" }, response =>
        {
            this.response = response;
        });

        await this.onMessage ("POST", "/tasks", { d: "hello" }, response =>
        {
            this.invalidEndpointResponse = response;
        });

        await this.onMessage ("DELETE", "/tasks/1");
    })
    .expectingPropertyToBeOfType ("args.0.socketIo", "http.service.plugins.SocketIoServer.Manager")
    .expectingPropertyToBe ("response.@name", "RequestSucceeded")
    .expectingPropertyToBe ("invalidEndpointResponse.@name", "NotFound")
    .expectingPropertyToBe ("spies.0.invocations.length", 3)
    .commit ()
;


test.method ("http.service.plugins.SocketIoServer", "onUpgrade")
    .should ("let the manager handle the upgrade")
    .given (nit.do (createTestService () (), srv =>
    {
        srv.server = nit.new ("http.Server");
        srv.server.nodeServer = no_http.createServer ();

    }), "req", "socket")
    .before (function ()
    {
        this.object.onInit (this.args[0]);
    })
    .mock ("args.0.socketIo", "handleUpgrade")
    .expectingPropertyToBe ("mocks.0.invocations.length", 1)
    .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "req")
    .expectingPropertyToBe ("mocks.0.invocations.0.args.1", "socket")
    .commit ()
;
