const SocketIoServer = nit.require ("http.serviceplugins.SocketIoServer");
const MockIncomingMessage = nit.require ("http.mocks.IncomingMessage");
const MockServerResponse = nit.require ("http.mocks.ServerResponse");
const no_http = require ("http");
const http = nit.require ("http");


function newServiceClass ()
{
    return nit.do (nit.defineClass ("TestService", "http.Service", true), SocketIoServer.onUsePlugin);
}


function newService ()
{
    const Service = new newServiceClass ();
    let service = new Service;

    service.server = new http.Server;
    service.server.nodeServer = no_http.createServer ();
    service.contextClass = nit.defineClass ("ServiceContext", "http.Context");

    return service;
}


test.method ("http.serviceplugins.SocketIoServer.Manager", "shouldHandleRequest")
    .should ("return %{result} if (path, req.path) = (%{createArgs.1}, %{args[0].path}")
        .init (s => s.createArgs = [newService (), "/sio"])
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io"))
        .returns (false)
        .commit ()

    .init (s => s.createArgs = [newService (), "/socket.io"])
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"))
        .returns (true)
        .commit ()
;


test.method ("http.serviceplugins.SocketIoServer.Manager", "handleRequest")
    .should ("handle the request if possible")
        .init (s => s.createArgs = [newService ()])
        .given (http.Context.new ("GET", "/socket.io/ab"))
        .mock ("object.engine", "handleRequest")
        .returns (true)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("return false if the request is not for socket.io")
        .init (s => s.createArgs = [newService (), "/sio"])
        .given (http.Context.new ("GET", "/socket.io/ab"))
        .mock ("object.io.engine", "handleRequest")
        .returns (false)
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()

    .should ("respond with the client file if serveClient is true")
        .init (s => s.createArgs = [newService (), { serveClient: true }])
        .given (http.Context.new ("GET", "/socket.io/socket.io.js"))
        .mock ("object.engine", "handleRequest")
        .returns (true)
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .expectingPropertyToBe ("args.0.response.constructor.name", "http.responses.FileReturned")
        .commit ()
;


test.method ("http.serviceplugins.SocketIoServer.Manager", "handleUpgrade")
    .should ("handle the request if possible")
        .init (s => s.createArgs = [newService ()])
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"))
        .mock ("object.io.engine", "handleUpgrade")
        .returns (true)
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("return false if the request is not for socket.io")
        .init (s => s.createArgs = [newService (), "/sio"])
        .given (
            nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"),
            { writable: false }
        )
        .mock ("object.io.engine", "handleUpgrade")
        .returns (false)
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()

    .should ("return false if the request is not for socket.io")
        .init (s => s.createArgs = [newService (), "/sio"])
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


test.method ("http.serviceplugins.SocketIoServer.Manager", "close")
    .should ("close the engine and sockets")
        .init (s => s.createArgs = [newService ()])
        .mock ("object.io", "close")
        .mock ("object.io", "disconnectSockets")
        .mock ("object.engine", "close")
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .expectingPropertyToBe ("mocks.2.invocations.length", 1)
        .commit ()
;


test.method ("http.serviceplugins.SocketIoServer.Manager", "dispatch")
    .should ("ask the service to dispatch the request")
        .init (s => s.createArgs = [newService ()])
        .given (new MockIncomingMessage ("GET", "/items/1"), new MockServerResponse ())
        .mock ("createArgs.0", "dispatch")
        .returnsInstanceOf (http.Context)
        .commit ()

    .should ("handle the dispatch error")
        .init (s => s.createArgs = [newService ()])
        .given (new MockIncomingMessage ("GET", "/items/1"), new MockServerResponse ())
        .mock ("createArgs.0", "dispatch", () => { throw 455; }) // eslint-disable-line no-throw-literal
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("result.response.constructor.status", 500)
        .commit ()

    .should ("handle the dispatch error")
        .init (s => s.createArgs = [newService ()])
        .given (new MockIncomingMessage ("GET", "/items/1"), new MockServerResponse ())
        .mock ("createArgs.0", "dispatch", () => { throw http.responseFor (403); })
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("result.response.constructor.status", 403)
        .commit ()

    .should ("handle the dispatch error")
        .init (s => s.createArgs = [newService ()])
        .given (new MockIncomingMessage ("GET", "/items/1"), new MockServerResponse ())
        .mock ("createArgs.0", "dispatch", () => { throw new Error ("UNKNOWN"); })
        .mock ("object", "error")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("result.response.constructor.status", 500)
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", "error.unexpected_error")
        .commit ()

    .should ("handle the dispatch error")
        .init (s => s.createArgs = [newService ()])
        .before (function ()
        {
            this.createArgs[0].contextClass.onPreConstruct (function ()
            {
                throw new Error ("Context init error!");
            });
        })
        .given (new MockIncomingMessage ("GET", "/items/1"), new MockServerResponse ())
        .mock ("object", "error")
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "error.unexpected_error")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.1.message", "Context init error!")
        .commit ()
;


test.method ("http.serviceplugins.SocketIoServer", "onUsePlugin", true)
    .should ("add the socketIo property to the service")
    .given (newServiceClass ())
    .expecting ("the service class has the socketIo instance property", "http.serviceplugins.SocketIoServer.Manager", function (s)
    {
        return s.args[0].getProperties (null, nit.Object.Property).find (p => p.name == "socketIo").type;
    })
    .commit ()
;


test.method ("http.serviceplugins.SocketIoServer", "preInit")
    .should ("initialize the service's socketIo property")
    .given (newService ())
    .mock ("args.0.socketIo", "dispatch")
    .before (s =>
    {
        let service = s.args[0];

        s.class.onUsePlugin (service.constructor);
    })
    .expectingPropertyToBeOfType ("args.0.socketIo", "http.serviceplugins.SocketIoServer.Manager")
    .commit ()
;


test.method ("http.serviceplugins.SocketIoServer", "preUpgrade")
    .should ("upgrade the request")
    .given (newService (), new MockIncomingMessage ("GET", "/socket.io/ab"))
    .before (s =>
    {
        let service = s.args[0];

        s.class.onUsePlugin (service.constructor);
        s.object.preInit (service);
    })
    .mock ("args.0.socketIo", "handleUpgrade")
    .expectingPropertyToBe ("mocks.0.invocations.length", 1)
    .commit ()
;


test.method ("http.serviceplugins.SocketIoServer", "preDispatch")
    .should ("handle the request")
    .given (newService (), http.Context.new ())
    .before (s =>
    {
        let service = s.args[0];

        s.class.onUsePlugin (service.constructor);
        s.object.preInit (service);
    })
    .after (async (s) =>
    {
        let service = s.args[0];

        let onConnection = service.socketIo.io.listeners ("connection")[0];
        let onMessage;

        onConnection (
        {
            on: function (event, listener)
            {
                if (event == "message")
                {
                    onMessage = listener;
                }
            }
        });


        await onMessage ("POST", "/events", { a: 1 });
        await onMessage ("POST", "/events", { a: 2 }, response => s.callbackResponse = response);
    })
    .mock ("args.0.socketIo", "handleRequest")
    .mock ("args.0.socketIo", "dispatch")
    .expectingPropertyToBe ("mocks.0.invocations.length", 1)
    .expectingPropertyToBeOfType ("mocks.1.invocations.0.args.0", "http.mocks.IncomingMessage")
    .expectingPropertyToBeOfType ("mocks.1.invocations.0.args.1", "http.mocks.ServerResponse")
    .expectingPropertyToBe ("callbackResponse.status", 500)
    .commit ()
;


test.method ("http.serviceplugins.SocketIoServer", "preStop")
    .should ("close the socket")
    .given (newService ())
    .before (s =>
    {
        let service = s.args[0];

        s.class.onUsePlugin (service.constructor);
        s.object.preInit (service);
    })
    .mock ("args.0.socketIo", "close")
    .expectingPropertyToBe ("mocks.0.invocations.length", 1)
    .commit ()
;


test.object ("http.serviceplugins.SocketIoServer")
    .should ("have a static property clientDistDir")
        .expectingPropertyToBeOfType ("class.clientDistDir", "nit.Dir")
        .expectingPropertyToBe ("class.clientDistDir.path", /client-dist$/)
        .commit ()

    .should ("have a static property clientFiles")
        .expecting ("the clientFiles contains socket.io.min.js", true, s => s.class.clientFiles.includes ("socket.io.min.js"))
        .commit ()

    .should ("return empty array for clientFiles if clientDistDir is not found")
        .before (s =>
        {
            s.class = s.class.defineSubclass ("SocketIoServer$1");
            nit.noop (s.class.clientDistDir);
        })
        .mock (nit, "resolveAsset")
        .expectingPropertyToBe ("class.clientFiles", [])
        .commit ()
;
