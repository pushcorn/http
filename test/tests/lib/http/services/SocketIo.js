test.object ("http.services.SocketIo")
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
            s.cc = s.class.clientDistDir;
        })
        .mock (nit, "resolveAsset")
        .expectingPropertyToBe ("class.clientFiles", [])
        .commit ()
;


test.method ("http.services.SocketIo", "applicableTo")
    .should ("return false if it shouldHandleRequest returns false")
        .givenContext ()
        .mock ("object", "shouldHandleRequest", () => false)
        .returns (false)
        .commit ()
;


test.method ("http.services.SocketIo", "shouldHandleRequest")
    .should ("return %{result} if (path, req.path) = (%{createArgs.1}, %{args[0].path}")
        .up (s => s.createArgs = "/sio")
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io"))
        .returns (false)
        .commit ()

    .up (s => s.createArgs = "/socket.io")
        .given (nit.new ("http.mocks.IncomingMessage", "GET", "/socket.io/ab"))
        .returns (true)
        .commit ()
;


test.method ("http.services.SocketIo", "handleRequest")
    .should ("handle the request if possible")
        .up (s =>
        {
            const MyHandler = s.http.defineHandler ("MyHandler")
                .onRun (() => s.handled = true)
            ;

            s.args =
            [
                s.IncomingMessage ("GET", "/socket.io/ab"),
                s.ServerResponse ()
            ];

            s.createArgs =
            {
                handlers: new MyHandler
            };
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("handled", true)
        .commit ()

    .should ("cast an integer error to its respective error")
        .up (s =>
        {
            const MyHandler = s.http.defineHandler ("MyHandler")
                .onRun (() => { throw 402; }) // eslint-disable-line no-throw-literal
            ;

            s.args =
            [
                s.IncomingMessage ("GET", "/socket.io/ab"),
                s.ServerResponse ()
            ];

            s.createArgs =
            {
                handlers: new MyHandler
            };
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBeOfType ("result.response", "http.responses.PaymentRequired")
        .commit ()

    .should ("set the response to the error if it's an instance of Response")
        .up (s =>
        {
            const MyHandler = s.http.defineHandler ("MyHandler")
                .onRun (() => { throw nit.new ("http.responses.RequestFailed"); })
            ;

            s.args =
            [
                s.IncomingMessage ("GET", "/socket.io/ab"),
                s.ServerResponse ()
            ];

            s.createArgs =
            {
                handlers: new MyHandler
            };
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBeOfType ("result.response", "http.responses.RequestFailed")
        .commit ()

    .should ("set the response RequestFailed for an unexpected error")
        .up (s =>
        {
            const MyHandler = s.http.defineHandler ("MyHandler")
                .onRun (() => { throw nit.assign (new Error ("ERR"), { code: "UNKNOWN" }); })
            ;

            s.args =
            [
                s.IncomingMessage ("GET", "/socket.io/ab"),
                s.ServerResponse ()
            ];

            s.createArgs =
            {
                handlers: new MyHandler
            };
        })
        .mock ("object", "error")
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBeOfType ("result.response", "http.responses.RequestFailed")
        .expectingPropertyToBe ("result.response.code", "UNKNOWN")
        .commit ()
;


test.method ("http.services.SocketIo", "shouldHandleRequest")
    .should ("return false if the request is not for socket.io")
        .up (s => s.createArgs = "/sio")
        .up (s => s.args = s.IncomingMessage ("GET", "/socket.io/ab"))
        .returns (false)
        .commit ()

    .should ("return true if the request is for socket.io")
        .up (s => s.createArgs = "/sio")
        .up (s => s.args = s.IncomingMessage ("GET", "/sio/ab"))
        .returns (true)
        .commit ()
;


test.method ("http.services.SocketIo", "preDispatch")
    .should ("respond with the client file if serveClient is true")
        .up (s => s.createArgs = { serveClient: true })
        .up (s => s.args = s.Context.new ("GET", "/socket.io/socket.io.js"))
        .expectingPropertyToBe ("args.0.response.constructor.name", "http.responses.File")
        .commit ()

    .should ("return if the service should not handle the request")
        .up (s => s.createArgs = { serveClient: true })
        .up (s => s.args = s.Context.new ("GET", "/sio/socket.io.js"))
        .commit ()

    .should ("handle the socket IO request")
        .up (s => s.createArgs = { serveClient: true })
        .up (s => s.args = s.Context.new ("GET", "/socket.io/ping"))
        .before (s => nit.dpv (s.object, "engine", { handleRequest: () => s.handled = true }))
        .expectingPropertyToBe ("args.0.response.constructor.name", "http.responses.Noop")
        .expectingPropertyToBe ("handled", true)
        .commit ()
;


test.method ("http.services.SocketIo", "preStop")
    .should ("close the IO engine")
        .before (s =>
        {
            s.closed = [];

            nit.dpv (s.object, "io",
            {
                disconnectSockets: () => s.closed.push ("disconnectSockets"),
                close: () => s.closed.push ("closeIo"),
                engine:
                {
                    close: () => s.closed.push ("closeEngine")
                }
            });
        })
        .expectingPropertyToBe ("closed", ["disconnectSockets", "closeIo", "closeEngine"])
        .commit ()
;


test.method ("http.services.SocketIo", "upgrade")
    .should ("upgrade the request if possible")
        .up (s => s.args = s.IncomingMessage ("GET", "/socket.io/ab"))
        .up (s => s.io = new s.class.SocketIo.Server (new s.NodeHttpServer))
        .before (s => nit.dpv (s.object, "io", s.io))
        .mock ("io.engine", "handleUpgrade")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("end the socket if socket is writeable and bytesWritten <= 0")
        .up (s => s.io = new s.class.SocketIo.Server (new s.NodeHttpServer))
        .up (s => s.args =
        [
            s.IncomingMessage ("GET", "/sio/ab"),
            { writable: true, bytesWritten: 0, end: nit.noop }
        ])
        .before (s => nit.dpv (s.object, "io", s.io))
        .mock ("args.1", "end")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("just return if no upgrade required")
        .up (s => s.io = new s.class.SocketIo.Server (new s.NodeHttpServer))
        .up (s => s.args =
        [
            s.IncomingMessage ("GET", "/sio/ab"),
            { writable: false, bytesWritten: 0, end: nit.noop }
        ])
        .before (s => nit.dpv (s.object, "io", s.io))
        .mock ("args.1", "end")
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()
;


test.method ("http.services.SocketIo", "start")
    .should ("set up the IO engine")
        .before (async (s) =>
        {
            s.object.host = new s.http.Host;
            s.object.host.server = new s.http.Server;
            s.object.host.server.nodeServer = new s.NodeHttpServer;

            await s.object.preStart ();
        })
        .after (async (s) =>
        {
            let onConnection = s.object.io.listeners ("connection")[0];
            let onMessage;

            const MyHandler = s.http.defineHandler ("MyHandler")
                .onRun (ctx => ctx.sendJson ({ b: 2 }))
            ;

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

            s.object.handlers.push (new MyHandler);

            await onMessage ("POST", "/events", { a: 1 });
            await onMessage ("POST", "/events", { a: 2 }, response => s.callbackResponse = response);
        })
        .spy ("object", "handleRequest")
        .expectingPropertyToBe ("spies.0.invocations.length", 2)
        .expectingPropertyToBeOfType ("spies.0.invocations.0.result.response", "http.responses.Json")
        .expectingPropertyToBe ("callbackResponse.status", 200)
        .commit ()
;
