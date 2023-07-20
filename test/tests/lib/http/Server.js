const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");

const http = nit.require ("http");
const no_http = require ("http");
const no_http_get = nit.promisify (no_http, "get", true);
const SocketIo = nit.require ("http.SocketIo");
const Context = nit.require ("http.Context");
const MockIncomingMessage = nit.require ("http.mocks.IncomingMessage");
const MockServerResponse = nit.require ("http.mocks.ServerResponse");
const MockNodeHttpServer = nit.require ("http.mocks.NodeHttpServer");
const MockSocket = nit.require ("http.mocks.Socket");
const Server = nit.require ("http.Server");


test.object ("http.Server")
    .should ("provide some useful properties")
        .after (function ()
        {
            this.result.nodeServer = Server.http.createServer ();
            this.result.nodeServer.address = function () { return { address: "192.168.0.1", port: 80 }; };
        })
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBe ("result.realIp", "192.168.0.1")
        .expectingPropertyToBe ("result.realPort", 80)
        .expectingPropertyToBe ("result.version", /^\d+\.\d+\.\d+$/)
        .commit ()

    .should ("define the shortHostname transform")
        .returnsInstanceOf ("http.Server")
        .after (function ()
        {
            this.result.info (this.result.logFormat, Context.new ({ headers: { host: "app.pushcorn.com" } }));
        })
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[app\.p\.c\]/)
        .commit ()
;


test.method ("http.Server", "selectObjectForHost", true)
    .should ("find the object applicable for the specified host")
    .up (s =>
    {
        let Service1 = http.defineService ("Service1").condition ("http:hostname", "app.pushcorn.com");
        let Service2 = http.defineService ("Service2").condition ("http:hostname", "dashboard.pushcorn.com");

        s.args = [[new Service1, new Service2], "dashboard.pushcorn.com"];
    })
    .returnsInstanceOf ("http.services.Service2")
    .commit ()
;


test.method ("http.Server", "addSocket")
    .should ("add the given socket to the socket list")
    .given (new MockSocket)
    .returnsInstanceOf ("http.Server")
    .after (s =>
    {
        let socket = s.args[0];

        s.numSocketsBeforeEnd = nit.keys (s.object.sockets).length;
        socket.listeners.timeout ();
        s.numSocketsAfterEnd = nit.keys (s.object.sockets).length;
    })
    .expectingPropertyToBe ("args.0.ended", true)
    .expectingPropertyToBe ("args.0.id", /^[0-9a-f]+$/)
    .expectingPropertyToBe ("numSocketsBeforeEnd", 1)
    .expectingPropertyToBe ("numSocketsAfterEnd", 0)
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


test.method ("http.Server", "endSockets")
    .should ("end and remove all open sockets")
    .before (function ()
    {
        this.object.addSocket (this.socket1 = new MockSocket ());
        this.object.addSocket (this.socket2 = new MockSocket ());
    })
    .returns ()
    .expectingPropertyToBe ("socket1.ended", true)
    .expectingPropertyToBe ("socket2.ended", true)
    .commit ()
;


test.method ("http.Server", "stop")
    .should ("return if the method has been called once")
        .before (function ()
        {
            let socket = new MockSocket ({ id: "1234" });

            this.object.stopTimeout = 5;
            this.object.addSocket (socket);
            this.object.nodeServer = new MockNodeHttpServer ();
        })
        .mock ("object", "endSockets")
        .mock ("object", "info")
        .mock ("object", "warn")
        .mock (process, "exit")
        .returnsInstanceOf ("http.Server")
        .after (async function ()
        {
            await this.object.stop ();
            await nit.sleep (10);
        })
        .expectingPropertyToBeOfType ("object.sockets.1234", "http.mocks.Socket")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.1.invocations.length", 2)
        .commit ()

    .should ("stop the services")
        .before (function ()
        {
            let Service1 = http.defineService ("Service1");
            let Service2 = http.defineService ("Service2");
            let Service3 = http.defineService ("Service3");

            this.object.services = [new Service1, new Service2, new Service3];
            this.object.nodeServer = new MockNodeHttpServer ();
            this.object.nodeServer.listen ();
            this.object.stopTimeout = 10;
        })
        .after (async function ()
        {
            await nit.sleep (50);
        })
        .mock ("object.services.0", "stop")
        .mock ("object.services.1", "stop", () => { throw 455; }) // eslint-disable-line no-throw-literal
        .mock ("object.services.2", "stop")
        .mock ("object", "info")
        .mock ("object", "error")
        .mock ("object", "warn")
        .mock (process, "exit")
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.2.invocations.length", 1)
        .expectingPropertyToBe ("mocks.4.invocations.length", 1)
        .expectingPropertyToBe ("mocks.5.invocations.length", 1)
        .expectingPropertyToBe ("mocks.6.invocations.length", 1)
        .expectingPropertyToBe ("mocks.6.invocations.0.args.0", 0)
        .commit ()
;


test.method ("http.Server", "dispatch")
    .should ("dispatch the request to a suitable service")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "dashboard.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (function ()
        {
            let Service1 = http.defineService ("Service1").condition ("http:hostname", "app.pushcorn.com");
            let Service2 = http.defineService ("Service2").condition ("http:hostname", "dashboard.pushcorn.com");

            this.object.services = [new Service1, new Service2];
        })
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[dashboard\.p\.c\]/)
        .commit ()

    .should ("return 404 if no suitable service was found")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "dashboard.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[dashboard\.p\.c\].*404/)
        .commit ()

    .should ("catch the service error")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "app.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (function ()
        {
            let Service1 = http.defineService ("Service1")
                .condition ("http:hostname", "app.pushcorn.com")
                .onDispatch (() => { throw 403; }) // eslint-disable-line no-throw-literal
            ;

            this.object.services = [new Service1];
        })
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[app\.p\.c\].*403/)
        .commit ()

    .reset ()
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "app.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (function ()
        {
            let Service1 = http.defineService ("Service1")
                .condition ("http:hostname", "app.pushcorn.com")
                .onDispatch (() => { throw http.responseFor (429); })
            ;

            this.object.services = [new Service1];
        })
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[app\.p\.c\].*429/)
        .commit ()

    .reset ()
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "app.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (function ()
        {
            let Service1 = http.defineService ("Service1")
                .condition ("http:hostname", "app.pushcorn.com")
                .onDispatch (() => { throw new Error ("UNKNOWN"); })
            ;

            this.object.services = [new Service1];
        })
        .mock ("object", "error")
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "error.unexpected_error")
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /\[INFO\] \[app\.p\.c\].*500/)
        .commit ()

    .should ("log the error if the server failed to construct the context")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "app.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (function ()
        {
            this.object.contextClass.onConstruct (() => { throw new Error ("CTX_ERR"); });
        })
        .mock ("object", "error")
        .mock (nit, "log")
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "error.unexpected_error")
        .expectingPropertyToBe ("args.1.statusCode", 500)
        .commit ()

    .should ("log the error if the context failed to write the response")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "app.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (function ()
        {
            this.object.contextClass.method ("writeResponse", () => { throw new Error ("WRITE_ERR"); });
        })
        .mock ("object", "error")
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "error.unexpected_error")
        .expectingPropertyToBe ("args.1.statusCode", 500)
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
            this.object.nodeServer = new MockNodeHttpServer ();
            await nit.sleep (10);
        })
        .mock ("object", "info")
        .mock ("object", "stop")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.1.invocations.length", 1)
        .commit ()
;


test.method ("http.Server", "start")
    .should ("start the server and listen for the incoming connections")
        .up (s =>
        {
            s.createArgs =
            [
            {
                port: 0,
                stopTimeout: 5,
                services: ["@http.services.FileServer"]
            }
            ];
        })
        .mock ("object", "info")
        .mock ("object", "warn")
        .mock (process, "exit")
        .after (async function ()
        {
            let server = this.result;

            await nit.sleep (20);
            let port = server.realPort;
            let res = await no_http_get (`http://127.0.0.1:${port}/`);

            this.socket = nit.values (server.sockets)[0];
            this.responseContent = await nit.readStream (res);

            await server.stop ();
            await nit.sleep (20);
        })
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBe ("responseContent", /<html lang="en">/)
        .expectingPropertyToBe ("socket.timeout", 30000)
        .expectingPropertyToBe ("object.stopped", true)
        .expectingMethodToReturnValueOfType ("object.start", null, "http.Server")
        .commit ()

    .should ("disable socket Keep-Alive if keepAliveTimeout is 0")
        .up (s =>
        {
            s.createArgs =
            {
                port: 0,
                stopTimeout: 0,
                keepAliveTimeout: 0,
                services: ["@http.services.FileServer"]
            };
        })
        .mock ("object", "info")
        .after (async function ()
        {
            let server = this.object;
            let port = server.realPort;
            let res = await no_http_get (`http://127.0.0.1:${port}/`);

            this.socket = nit.values (server.sockets)[0];
            this.responseContent = await nit.readStream (res);

            await server.stop ();
        })
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "info.server_started")
        .expectingPropertyToBe ("responseContent", /<html lang="en">/)
        .expectingPropertyToBe ("socket.timeout", undefined)
        .expectingPropertyToBe ("object.stopped", true)
        .commit ()

    .should ("rethrow the port-in-use error if the error code is EADDRINUSE")
        .up (s =>
        {
            s.createArgs =
            {
                keepAliveTimeout: 0,
                stopTimeout: 0
            };
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
        .mock ("object", "info")
        .returnsInstanceOf ("http.Server")
        .after (async function ()
        {
            let server = this.object;
            let error = new Error ("address in use");

            error.code = "EADDRINUSE";

            try
            {
                await server.nodeServer.listeners ("error")[0] (error);
            }
            catch (e)
            {
                this.serverError = e;
            }
        })
        .expectingPropertyToBe ("serverError.code", "error.port_in_use")
        .expectingPropertyToBe ("object.stopped", true)
        .commit ()

    .should ("rethrow the original node server error")
        .up (s =>
        {
            s.createArgs =
            {
                keepAliveTimeout: 0,
                stopTimeout: 0
            };
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
        .mock ("object", "info")
        .returnsInstanceOf ("http.Server")
        .after (async function ()
        {
            let server = this.object;
            let error = new Error ("we are in trouble");

            error.code = "TROUBLE";

            try
            {
                await server.nodeServer.listeners ("error")[0] (error);
            }
            catch (e)
            {
                this.serverError = e;
            }
        })
        .expectingPropertyToBe ("serverError.code", "TROUBLE")
        .expectingPropertyToBe ("object.stopped", true)
        .commit ()

    .should ("find a suitable server to handle the upgrade event")
        .up (s =>
        {
            s.createArgs =
            {
                keepAliveTimeout: 0,
                stopTimeout: 0,
                services: ["@http.services.FileServer"]
            };
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
        .mock ("object", "info")
        .returnsInstanceOf ("http.Server")
        .after (async function ()
        {
            let server = this.object;
            let Service1 = http.defineService ("Service1").condition ("http:hostname", "app.pushcorn.com");
            let Service2 = http.defineService ("Service2").condition ("http:hostname", "dashboard.pushcorn.com")
                .onUpgrade (() =>
                {
                    this.upgraded = true;
                })
            ;

            let req = new MockIncomingMessage ("GET", "/", { headers: { host: "dashboard.pushcorn.com" } });
            let socket = new MockSocket ();

            server.services = [new Service1, new Service2];
            server.nodeServer.listeners ("upgrade")[0] (req, socket, {});

            await server.stop ();
        })
        .expectingPropertyToBe ("upgraded", true)
        .expectingPropertyToBe ("object.stopped", true)
        .commit ()

    .should ("create an secure server if the certificates are provided")
        .up (s =>
        {
            s.createArgs =
            {
                keepAliveTimeout: 0,
                stopTimeout: 0,
                certificates: s.http.Certificate.Descriptor (
                {
                    hostnames: "app.pushcorn.com",
                    options:
                    {
                        cert: CERTS_DIR.join ("pushcorn.com.crt"),
                        key: CERTS_DIR.join ("pushcorn.com.key")
                    }
                }).build ()
                ,
                services: ["@http.services.FileServer"]
            };
        })
        .mock (
        {
            object: Server.http2,
            method: "createSecureServer",
            retval: () => new MockNodeHttpServer
        })
        .mock ("object", "info")
        .after (async function ()
        {
            let server = this.object;

            await server.stop ();
        })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.allowHTTP1", true)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.requestCert", false)
        .expecting ("the SNICallback to return the secure context if found", true, async function (s)
        {
            let SNICallback = nit.get (s, "mocks.0.invocations.0.args.0.SNICallback");

            return (await nit.promisify (SNICallback) ("app.pushcorn.com")).constructor == http.SecureContext;
        })
        .expecting ("the SNICallback to return undefined if not found", true, async function (s)
        {
            let SNICallback = nit.get (s, "mocks.0.invocations.0.args.0.SNICallback");

            return await nit.promisify (SNICallback) ("dashboard.pushcorn.com") === undefined;
        })
        .commit ()

    .should ("create an secure server using https.createServer if http2 is set to false")
        .up (s =>
        {
            s.createArgs =
            {
                keepAliveTimeout: 0,
                stopTimeout: 0,
                http2: false,
                certificates: s.http.Certificate.Descriptor (
                {
                    hostnames: "app.pushcorn.com",
                    options:
                    {
                        cert: CERTS_DIR.join ("pushcorn.com.crt"),
                        key: CERTS_DIR.join ("pushcorn.com.key")
                    }
                }).build ()
                ,
                services: ["@http.services.FileServer"]
            };
        })
        .mock (
        {
            object: Server.https,
            method: "createServer",
            retval: () => new MockNodeHttpServer
        })
        .mock ("object", "info")
        .after (async function ()
        {
            let server = this.object;

            await server.stop ();
        })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.allowHTTP1", true)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.requestCert", false)
        .expecting ("the SNICallback to return the secure context if found", true, async function (s)
        {
            let SNICallback = nit.get (s, "mocks.0.invocations.0.args.0.SNICallback");

            return (await nit.promisify (SNICallback) ("app.pushcorn.com")).constructor == http.SecureContext;
        })
        .expecting ("the SNICallback to return undefined if not found", true, async function (s)
        {
            let SNICallback = nit.get (s, "mocks.0.invocations.0.args.0.SNICallback");

            return await nit.promisify (SNICallback) ("dashboard.pushcorn.com") === undefined;
        })
        .commit ()
;


test.object ("http.Server")
    .should ("properly handle the requests")
    .application ()
    .given (
    {
        port: 0,
        stopTimeout: 0
    })
    .mock ("result", "info")
    .after (async function ()
    {
        nit.ASSET_PATHS.unshift (this.app.root.path);

        await this.app.root.createAsync ("public");

        http.defineResponse ("Hello")
            .info (200, "Hello")
            .field ("<greeting>", "string")
        ;
    })
    .after (async function ()
    {
        let server = this.server = this.result;
        let api1 = new http.defineApi ("Hello")
            .endpoint ("GET", "/hello")
            .response ("http.responses.Hello")
            .defineRequest (Request =>
            {
                Request.parameter ("name", "string");
            })
            .onRun (ctx => ctx.send (`Hello ${ctx.request.name}!`)) ()
        ;

        let service1 = http.defineService ("Service1")
            .serviceplugin ("http:socket-io-server")
            .serviceplugin ("http:file-server")
            .serviceplugin ("http:live-reload", { delay: 30 }) ()
        ;

        service1.apis = [api1];
        server.services = [service1];

        await server.start ();
        await nit.sleep (50);

        this.port = server.realPort;
    })
    .after (async function ()
    {
        let res = await no_http_get (`http://127.0.0.1:${this.port}/hello?name=John`);

        this.response1 = JSON.parse (await nit.readStream (res));
    })
    .after (async function ()
    {
        let client = new SocketIo.Client (`http://127.0.0.1:${this.port}`);

        this.response2 = await client.fetchJson ("GET", "/hello", { name: "Jane" });

        await client.close ();
    })
    .after (async function ()
    {
        let res = await no_http_get (`http://127.0.0.1:${this.port}/`);

        this.response3 = await nit.readStream (res);
    })
    .after (async function ()
    {
        let client = new SocketIo.Client (`http://127.0.0.1:${this.port}`);
        let file = nit.new ("nit.File", this.app.root.join ("public/index.html"));

        await nit.sleep (200);

        client.on ("message", (method, path, data) =>
        {
            this.response4 = { method, path, data };
        });

        await file.writeAsync ("NEW INDEX");
        await nit.sleep (200);
        await client.close ();
    })
    .after (async function ()
    {
        await this.server.stop ();
    })
    .expectingPropertyToBe ("response1.greeting", "Hello John!")
    .expectingPropertyToBe ("response2.greeting", "Hello Jane!")
    .expectingPropertyToBe ("response3", /nit server \{% server\.version %\}/)
    .expectingPropertyToBe ("response4", { method: "POST", path: "/live-reloads", data: undefined })
    .commit ()
;


test.method ("http.Server.Descriptor", "build")
    .should ("build the server")
    .up (s =>
    {
        s.createArgs =
        {
            options:
            {
                port: 1234,
                keepAliveTimeout: 0,
                stopTimeout: 0
            }
            ,
            certificates:
            {
                hostnames: "app.pushcorn.com",
                options:
                {
                    cert: CERTS_DIR.join ("pushcorn.com.crt"),
                    key: CERTS_DIR.join ("pushcorn.com.key")
                }
            }
            ,
            services: ["http:file-server"]
        };
    })
    .returnsInstanceOf ("http.Server")
    .expectingPropertyToBe ("result.port", 1234)
    .expectingPropertyToBe ("result.certificates.length", 1)
    .expectingPropertyToBe ("result.services.length", 1)
    .expectingPropertyToBeOfType ("result.services.0", "http.services.FileServer")
    .commit ()
;
