const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");

const MockIncomingMessage = nit.require ("http.mocks.IncomingMessage");
const MockServerResponse = nit.require ("http.mocks.ServerResponse");
const MockNodeHttpServer = nit.require ("http.mocks.NodeHttpServer");
const MockSocket = nit.require ("http.mocks.Socket");
const Server = nit.require ("http.Server");


test.object ("http.Server")
    .reset ("represents a runnable HTTP server")
        .given (
        {
            cert: CERTS_DIR.join ("pushcorn.com.crt"),
            key: CERTS_DIR.join ("pushcorn.com.key"),
            ca: CERTS_DIR.join ("ca.pushcorn.com.crt")
        })
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBeOfType ("result.secureContext", "http.SecureContext")
        .commit ()
;


test.method ("http.Server", "selectService")
    .should ("select the service with highest priority")
        .up (function ()
        {
            const AppService = nit.defineClass ("test.services.AppService", "http.Service");
            const DashboardService = nit.defineClass ("test.services.DashboardService", "http.Service");

            this.createArgs =
            [
            {
                services: [new AppService (), new DashboardService ()]
            }
            ];
        })
        .given ("dashboard.pushcorn.com")
        .returnsInstanceOf ("test.services.AppService")
        .commit ()

    .reset ()
        .up (function ()
        {
            const AppService = nit.defineClass ("test.services.AppService", "http.Service");
            const DashboardService = nit.defineClass ("test.services.DashboardService", "http.Service");

            this.createArgs =
            [
            {
                services: [new AppService (), new DashboardService ("dashboard.pushcorn.com")]
            }
            ];
        })
        .given ("dashboard.pushcorn.com")
        .returnsInstanceOf ("test.services.DashboardService")
        .commit ()
;


test.method ("http.Server", "log")
    .should ("log the message to the console")
        .given ("error.unknown_error")
        .mock (nit, "log")
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "error.unknown_error")
        .commit ()
;


test.method ("http.Server", "removeSocket")
    .should ("remove the socket from sockets")
        .before (function ()
        {
            let st = this;
            let socket = new MockSocket ();

            st.object.addSocket (socket);
            st.args[0] = socket;
        })
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBe ("object.sockets", {})
        .commit ()
;


test.method ("http.Server", "trackSocketRequest")
    .should ("track the open requests for a socket")
        .given (new MockIncomingMessage ("GET", "/users"), new MockServerResponse ())
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBe ("args.0.socket.requests.length", 1)
        .commit ()

    .should ("end the socket if there is no associated request when the server is stopped")
        .given (new MockIncomingMessage ("GET", "/users"), new MockServerResponse ())
        .returnsInstanceOf ("http.Server")
        .after (function ()
        {
            this.object.$__stopped = true;
            this.args[1].listeners ("finish")[0] ();
        })
        .expectingPropertyToBe ("args.0.socket.requests.length", 0)
        .expectingPropertyToBe ("args.0.socket.ended", true)
        .commit ()

    .should ("not close the socket on request finish when the server is not stopped")
        .given (new MockIncomingMessage ("GET", "/users"), new MockServerResponse ())
        .returnsInstanceOf ("http.Server")
        .after (function ()
        {
            this.args[1].listeners ("finish")[0] ();
        })
        .expectingPropertyToBe ("args.0.socket.requests.length", 0)
        .expectingPropertyToBe ("args.0.socket.ended", false)
        .commit ()
;


test.method ("http.Server", "stop")
    .should ("return if there are open sockets")
        .up (function ()
        {
            this.createArgs = [{ stopTimeout: 0 }];
        })
        .before (function ()
        {
            let socket = new MockSocket ({ id: "1234" });

            this.object.addSocket (socket);
        })
        .mock ("object", "endSockets")
        .returnsInstanceOf ("http.Server")
        .after (async function ()
        {
            await this.object.stop ();
            await nit.sleep (10);
        })
        .expectingPropertyToBeOfType ("object.sockets.1234", "http.mocks.Socket")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()
;


test.method ("http.Server", "dispatch")
    .should ("dispatch the request to a service that can handle it")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "dashboard.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .up (function ()
        {
            const AppService = nit.defineClass ("test.services.AppService", "http.Service");
            const DashboardService = nit.defineClass ("test.services.DashboardService", "http.Service")
                .method ("run", function ()
                {
                    throw new Error ("catch this!");
                })
            ;

            this.createArgs =
            [
            {
                services: [new AppService (), new DashboardService ("dashboard.pushcorn.com")]
            }
            ];
        })
        .mock (nit, "log")
        .returnsInstanceOf ("http.Service.Context")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "[UNEXPECTED_ERROR]")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.1.message", "catch this!")
        .expectingPropertyToBe ("args.1.data", nit.new ("http.responses.RequestFailed").toBody ())
        .commit ()

    .should ("set the response to ResourceNotFound if the service did not provide one")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "dashboard.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .up (function ()
        {
            const AppService = nit.defineClass ("test.services.AppService", "http.Service");
            const DashboardService = nit.defineClass ("test.services.DashboardService", "http.Service")
                .method ("run", function ()
                {
                })
            ;

            this.createArgs =
            [
            {
                services: [new AppService (), new DashboardService ("dashboard.pushcorn.com")]
            }
            ];
        })
        .returnsInstanceOf ("http.Service.Context")
        .expectingPropertyToBeOfType ("result.response", "http.responses.ResourceNotFound")
        .expectingPropertyToBe ("args.1.data", nit.new ("http.responses.ResourceNotFound").toBody ())
        .commit ()

    .should ("use the response from the service")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "dashboard.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .up (function ()
        {
            const AppService = nit.defineClass ("test.services.AppService", "http.Service");
            const DashboardService = nit.defineClass ("test.services.DashboardService", "http.Service")
                .method ("run", function (ctx)
                {
                    ctx.response = nit.new ("http.responses.AccessUnauthorized");
                })
            ;

            this.createArgs =
            [
            {
                services: [new AppService (), new DashboardService ("dashboard.pushcorn.com")]
            }
            ];
        })
        .returnsInstanceOf ("http.Service.Context")
        .expectingPropertyToBeOfType ("result.response", "http.responses.AccessUnauthorized")
        .commit ()

    .should ("set the response to ResourceNotFound if no service was selected")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "dashboard.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBeOfType ("result.response", "http.responses.ResourceNotFound")
        .expectingPropertyToBe ("args.1.data", nit.new ("http.responses.ResourceNotFound").toBody ())
        .commit ()

    .should ("stop the server if oneShot is true")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "dashboard.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .up (function ()
        {
            this.createArgs = [{ oneShot: true, stopTimeout: 0 }];
        })
        .after (async function ()
        {
            let server = this.object;
            let socket = new MockSocket ({ id: "1234" });
            let listener = this.args[1].listeners ("finish")[1];

            server.addSocket (socket);

            await listener ();
            await nit.sleep (10);
        })
        .returnsInstanceOf ("http.Context")
        .expectingPropertyToBe ("object.sockets", {})
        .commit ()
;


test.method ("http.Server", "start")
    .should ("start the server and listen for the incoming connections")
        .up (function ()
        {
            const AppService = nit.defineClass ("test.services.AppService", "http.Service");
            const DashboardService = nit.defineClass ("test.services.DashboardService", "http.Service");

            this.createArgs =
            [
            {
                cert: CERTS_DIR.join ("pushcorn.com.crt"),
                key: CERTS_DIR.join ("pushcorn.com.key"),
                services: [new AppService (), new DashboardService ("dashboard.pushcorn.com")],
                noHttp2: true
            }
            ];
        })
        .mock (
        {
            object: Server.https,
            method: "createServer",
            retval: function ()
            {
                return new MockNodeHttpServer ();
            }
        })
        .mock ("object", "log")
        .after (function ()
        {
            this.object.nodeServer.removeAllListeners ();
        })
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.allowHTTP1", true)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.requestCert", false)
        .expectingPropertyToBe ("mocks.0.invocations.0.result.port", 443)
        .expectingPropertyToBe ("mocks.0.invocations.0.result.listenerMap", {})
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", "info.server_started")
        .expectingPropertyToBeOfType ("mocks.0.invocations.0.args.0.SNICallback", "function")
        .expecting ("the SNICallback will return the server's secureContext", true, function (s)
        {
            let sc;

            nit.get (s, "mocks.0.invocations.0.args.0.SNICallback") ("dashboard.pushcorn.com", (e, s) => sc = s);

            return sc == s.object.secureContext;
        })
        .commit ()
;


test.method ("http.Server", "start")
    .should ("use service's SecureContext if available")
        .up (function ()
        {
            const AppService = nit.defineClass ("test.services.AppService", "http.Service");
            const DashboardService = nit.defineClass ("test.services.DashboardService", "http.Service");

            this.createArgs =
            [
            {
                cert: CERTS_DIR.join ("pushcorn.com.crt"),
                key: CERTS_DIR.join ("pushcorn.com.key"),
                services:
                [
                    new AppService (),
                    new DashboardService ("dashboard.pushcorn.com",
                    {
                        cert: CERTS_DIR.join ("pushcorn.com.crt"),
                        key: CERTS_DIR.join ("pushcorn.com.key")
                    })
                ]
            }
            ];
        })
        .mock (
        {
            object: Server.http2,
            method: "createSecureServer",
            retval: function ()
            {
                return new MockNodeHttpServer ();
            }
        })
        .mock ("object", "log")
        .after (function ()
        {
            this.object.nodeServer.removeAllListeners ("connection");
        })
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.0.result.port", 443)
        .expectingPropertyToBe ("mocks.0.invocations.0.result.listenerMap.connection", undefined)
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", "info.server_started")
        .expecting ("the SNICallback will return the service's secureContext", true, function (s)
        {
            let sc;

            nit.get (s, "mocks.0.invocations.0.args.0.SNICallback") ("dashboard.pushcorn.com", (e, s) => sc = s);

            return sc == s.object.services[1].secureContext;
        })
        .commit ()
;


test.method ("http.Server", "start")
    .should ("create an HTTP server if no certificates were provided")
        .up (function ()
        {
            this.createArgs = [{ port: 81 }];
        })
        .mock (
        {
            object: Server.http,
            method: "createServer",
            retval: function ()
            {
                return new MockNodeHttpServer ();
            }
        })
        .mock ("object", "log")
        .mock ("object", "dispatch")
        .returns ()
        .after (async function ()
        {
            let server = nit.get (this, "mocks.0.invocations.0.result");

            this.socket = new MockSocket ();

            server.listeners ("connection")[0] (this.socket);
            server.listeners ("request")[0] ("REQ", "RES");

            try
            {
                await server.listeners ("error")[0] (new Error ("launch error!"));
            }
            catch (e)
            {
                this.serverError = e;
            }
        })
        .expectingPropertyToBe ("object.secureContext", undefined)
        .expectingPropertyToBe ("mocks.0.invocations.0.result.port", 81)
        .expectingPropertyToBe ("socket.keepAlive", true)
        .expectingPropertyToBe ("socket.timeout", Server.prototype.keepAliveTimeout)
        .expectingPropertyToBe ("mocks.2.invocations.0.args", ["REQ", "RES"])
        .expectingPropertyToBe ("serverError.message", "launch error!")
        .commit ()
;


test.method ("http.Server", "start")
    .should ("disable socket Keep-Alive if keepAliveTimeout is 0")
        .up (function ()
        {
            this.createArgs =
            [
            {
                keepAliveTimeout: 0
            }
            ];
        })
        .mock (
        {
            object: Server.http,
            method: "createServer",
            retval: function ()
            {
                return new MockNodeHttpServer ();
            }
        })
        .mock ("object", "log")
        .returns ()
        .after (async function ()
        {
            let server = nit.get (this, "mocks.0.invocations.0.result");
            let socket = this.socket = new MockSocket ();

            socket.on ("end", nit.noop);

            server.listeners ("connection")[0] (socket);
            socket.listeners.timeout ();
        })
        .expectingPropertyToBe ("socket.keepAlive", false)
        .expectingPropertyToBe ("socket.ended", true)
        .expectingPropertyToBe ("object.sockets", {})
        .commit ()
;


test.method ("http.Server", "start")
    .should ("rethrow the port-in-use error if the error code is EADDRINUSE")
        .up (function ()
        {
            this.createArgs =
            [
            {
                keepAliveTimeout: 0
            }
            ];
        })
        .mock (
        {
            object: Server.http,
            method: "createServer",
            retval: function ()
            {
                return new MockNodeHttpServer ();
            }
        })
        .mock ("object", "log")
        .returns ()
        .after (async function ()
        {
            let server = nit.get (this, "mocks.0.invocations.0.result");
            let error = new Error ("address in use");

            error.code = "EADDRINUSE";

            try
            {
                await server.listeners ("error")[0] (error);
            }
            catch (e)
            {
                this.serverError = e;
            }
        })
        .expectingPropertyToBe ("serverError.code", "error.port_in_use")
        .commit ()
;
