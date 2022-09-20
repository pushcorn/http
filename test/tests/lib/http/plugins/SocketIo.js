const MockNodeHttpServer = nit.require ("http.mocks.NodeHttpServer")
    .staticGetter ("testClass", function ()
    {
        return this.defineSubclass (this.name, true);
    })
;



test.method ("http.plugins.SocketIo", "onRegisterPlugin", true)
    .should ("define the property that stores the socket IO object")
        .given (nit.defineClass ("Server"), nit.new ("http.plugins.SocketIo"))
        .expecting ("the property 'io' was defined", true, function ({ args })
        {
            let Server = args[0];
            let prop = Server.getProperties (null, nit.Object.Property)[0];

            return prop.name == "io" && prop.type == "http.SocketIo.Server";
        })
        .commit ()

    .given (nit.defineClass ("Server"), nit.new ("http.plugins.SocketIo", "sio"))
        .expecting ("the property 'sio' was defined if exportAs is 'sio'", true, function ({ args })
        {
            let Server = args[0];
            let prop = Server.getProperties (null, nit.Object.Property)[0];

            return prop.name == "sio" && prop.type == "http.SocketIo.Server";
        })
        .commit ()
;


test.method ("http.plugins.SocketIo", "onStart")
    .should ("assign a new instance of Socket IO server to the server")
        .given (new MockNodeHttpServer.testClass ())
        .before (function ()
        {
            this.class.onRegisterPlugin (this.args[0].constructor, this.object);
        })
        .expectingPropertyToBeOfType ("args.0.io", "http.SocketIo.Server")
        .commit ()
;


test.method ("http.plugins.SocketIo", "onStop")
    .should ("stop the Socket IO engine disconnect all sockets")
        .given (new MockNodeHttpServer.testClass ())
        .before (function ()
        {
            this.class.onRegisterPlugin (this.args[0].constructor, this.object);
            this.object.onStart (this.args[0]);

            let socket = this.socket =
            {
                id: nit.uuid (),
                disconnect: function ()
                {
                    socket.disconnected = true;
                }
            };

            this.args[0].io.engine = { close: nit.noop };
            this.args[0].io.sockets.connected = { [socket.id]: socket };
        })
        .expectingPropertyToBeOfType ("args.0.io", "http.SocketIo.Server")
        .expectingPropertyToBe ("socket.disconnected", true)
        .commit ()

    .should ("just return if the Socket IO server was not available")
        .given (new MockNodeHttpServer.testClass ())
        .commit ()
;
