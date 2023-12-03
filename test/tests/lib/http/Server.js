const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");

const http = nit.require ("http");
// const no_http = require ("http");
// const no_http_get = nit.promisify (no_http, "get", true);
// const SocketIo = nit.require ("http.SocketIo");
const Context = nit.require ("http.Context");
const MockIncomingMessage = nit.require ("http.mocks.IncomingMessage");
const MockServerResponse = nit.require ("http.mocks.ServerResponse");
const MockNodeHttpServer = nit.require ("http.mocks.NodeHttpServer");
const MockSocket = nit.require ("http.mocks.Socket");
const Server = nit.require ("http.Server");


nit.arrayRemove (nit.SHUTDOWN_EVENTS, "SHUTDOWN");


test.object ("http.Server")
    .should ("provide some useful properties")
        .after (function ()
        {
            this.result.nodeServer = Server.http.createServer ();
            this.result.nodeServer.address = function () { return { address: "192.168.0.1", port: 0 }; };
        })
        .returnsInstanceOf ("http.Server")
        .expectingPropertyToBe ("result.realIp", "192.168.0.1")
        .expectingPropertyToBe ("result.realPort", /^\d+$/)
        .expectingPropertyToBe ("result.version", /^\d+\.\d+\.\d+$/)
        .commit ()

    .should ("define the shortHostname transform")
        .returnsInstanceOf ("http.Server")
        .before (s => s.class.Logger.colorize = false)
        .after (function ()
        {
            this.result.info (this.result.logFormat, Context.new ({ headers: { host: "app.pushcorn.com" } }));
        })
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[INFO\] \[app\.p\.c\]/)
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
            this.object.$__state = "started";
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
    .should ("not force exit if stopTimeout is zero")
        .up (s => s.createArgs = { stopTimeout: 0, port: 0 })
        .mock ("object", "info")
        .mock ("object", "warn")
        .mock (process, "exit")
        .before (s => s.object.start ())
        .before (async (s) => await nit.promisify (s.object.nodeServer, "close") ())
        .expectingPropertyToBe ("mocks.0.invocations.length", 3)
        .expectingPropertyToBe ("mocks.1.invocations.length", 0)
        .expectingPropertyToBe ("mocks.2.invocations.length", 0)
        .commit ()

    .should ("log the shutdown error")
        .up (s => s.createArgs = { stopTimeout: 5, port: 0 })
        .before (s =>
        {
            let socket = new MockSocket ({ id: "1234" });
            let MyHost = s.Host.defineSubclass ("MyHost")
                .onStop (() => { throw new Error ("cannot shutdown!"); })
            ;

            s.object.addSocket (socket);
            s.object.nodeServer = new MockNodeHttpServer ();
            s.object.hosts = new MyHost;
        })
        .mock ("object", "endSockets")
        .mock ("object", "info")
        .mock ("object", "warn")
        .mock ("object", "error")
        .mock (process, "exit")
        .before (s => s.object.start ())
        .after (() => nit.sleep (50))
        .returnsResultOfExpr ("object")
        .expectingPropertyToBeOfType ("object.sockets.1234", "http.mocks.Socket")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.1.invocations.length", 3)
        .expectingPropertyToBe ("mocks.3.invocations.length", 1)
        .expectingPropertyToBe ("mocks.3.invocations.0.args.1.message", "cannot shutdown!")
        .commit ()
;


test.method ("http.Server", "dispatch")
    .should ("dispatch the request to a suitable service")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "dashboard.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[dashboard\.p\.c\]/)
        .commit ()

    .should ("return 404 if no host was found")
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
        .before (s =>
        {
            let MyHost = s.Host.defineSubclass ("MyHost")
                .onDispatch (() => { throw 403; }) // eslint-disable-line no-throw-literal
            ;

            s.object.hosts = new MyHost ({ names: "app.pushcorn.com" });
        })
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[app\.p\.c\].*403/)
        .expectingPropertyToBe ("result.response.constructor.name", "http.responses.Forbidden")
        .commit ()

    .should ("dispatch the request to the first matching host")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "app.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (s =>
        {
            let MyHost1 = s.Host.defineSubclass ("MyHost1")
                .onDispatch (() => { throw 403; }) // eslint-disable-line no-throw-literal
            ;

            let MyHost2 = s.Host.defineSubclass ("MyHost2")
                .onDispatch (ctx => ctx.sendText ("Hello"))
            ;

            s.object.hosts =
            [
                new MyHost1 ({ names: "dashboard.pushcorn.com" }),
                new MyHost2 ({ names: "app.pushcorn.com" })
            ];
        })
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[app\.p\.c\].*200/)
        .expectingPropertyToBe ("result.response.text", "Hello")
        .commit ()

    .should ("send 404 if no matching host found")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "dashboard.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (s =>
        {
            let MyHost = s.Host.defineSubclass ("MyHost")
                .condition ("http:custom", () => false)
            ;

            s.object.hosts = new MyHost;
        })
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[dashboard\.p\.c\].*404/)
        .commit ()

    .reset ()
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "app.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (s =>
        {
            let MyHost = s.Host.defineSubclass ("MyHost")
                .onDispatch (() => { throw http.responseFor (429); })
            ;

            s.object.hosts = new MyHost ({ names: "app.pushcorn.com" });
        })
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /\[INFO\] \[app\.p\.c\].*429/)
        .expectingPropertyToBe ("result.response.constructor.name", "http.responses.TooManyRequests")
        .commit ()

    .reset ()
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "app.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .before (s =>
        {
            let MyHost = s.Host.defineSubclass ("MyHost")
                .onDispatch (() => { throw new Error ("UNKNOWN"); })
            ;

            s.object.hosts = new MyHost ({ names: "app.pushcorn.com" });
        })
        .mock ("object", "error")
        .mock (nit, "log")
        .returnsInstanceOf (http.Context)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "error.unexpected_error")
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /\[INFO\] \[app\.p\.c\].*400/)
        .commit ()

    .should ("log the error if the context failed to write the response")
        .given (
            new MockIncomingMessage ("GET", "/users", { headers: { host: "app.pushcorn.com" } }),
            new MockServerResponse ()
        )
        .mock ("object", "error")
        .mock (nit, "log")
        .mock ("http.Context.prototype", "writeResponse", () => { throw new Error ("WRITE_ERR"); })
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
        .up (s => s.hostCalled = [])
        .up (s => s.MyHost = s.Host.defineSubclass ("MyHost")
            .onPreStart (() => s.hostCalled.push ("preStart"))
            .onPostStart (() => s.hostCalled.push ("postStart"))
            .onStart (() => s.hostCalled.push ("start"))
        )
        .up (s =>
        {
            s.createArgs =
            {
                port: 0,
                stopTimeout: 5,
                hosts: new s.MyHost
            };
        })
        .before (s => s.class.Logger.colorize = false)
        .mock ("object", "info")
        .mock ("object", "warn")
        .mock (process, "exit")
        .after (s => { s.object.stop (); })
        .after (() => nit.sleep (50))
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("mocks.2.invocations.length", 1)
        .expectingPropertyToBe ("hostCalled", ["preStart", "start", "postStart"])
        .commit ()

    .should ("rethrow the port-in-use error if the error code is EADDRINUSE")
        .up (s => s.createArgs = { keepAliveTimeout: 0, stopTimeout: 0 })
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
        .returnsResultOfExpr ("object")
        .after (async (s) =>
        {
            let error = nit.assign (new Error ("address in use"), { code: "EADDRINUSE" });

            try
            {
                await s.object.nodeServer.listeners ("error")[0] (error);
            }
            catch (e)
            {
                s.serverError = e;
            }
        })
        .expectingPropertyToBe ("serverError.code", "error.port_in_use")
        .expectingPropertyToBe ("object.state", "stopped")
        .commit ()

    .should ("rethrow the original node server error")
        .up (s => s.createArgs = { keepAliveTimeout: 0, stopTimeout: 0 })
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
        .returnsResultOfExpr ("object")
        .after (async (s) =>
        {
            let error = nit.assign (new Error ("we are in trouble"), { code: "TROUBLE" });

            try
            {
                await s.object.nodeServer.listeners ("error")[0] (error);
            }
            catch (e)
            {
                s.serverError = e;
            }
        })
        .expectingPropertyToBe ("serverError.code", "TROUBLE")
        .expectingPropertyToBe ("object.state", "stopped")
        .commit ()

    .should ("find a suitable host to handle the upgrade event")
        .up (s =>
        {
            let MyHost = s.Host.defineSubclass ("MyHost")
                .onUpgrade (() => s.upgradeCalled = true)
            ;

            s.createArgs =
            {
                keepAliveTimeout: 0,
                stopTimeout: 0,
                hosts: new MyHost
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
        .mock ("object", "dispatch")
        .after (async (s) =>
        {
            let req = new MockIncomingMessage ("GET", "/", { headers: { host: "dashboard.pushcorn.com" } });
            let socket = new MockSocket ();

            s.object.nodeServer.listeners ("connection")[0] (socket);
            s.object.nodeServer.listeners ("upgrade")[0] (req, socket, {});
            s.object.nodeServer.listeners ("request")[0] (req);
            s.socketCount = nit.keys (s.object.sockets).length;

            await s.object.stop ();
        })
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("upgradeCalled", true)
        .expectingPropertyToBe ("socketCount", 1)
        .expectingPropertyToBe ("mocks.2.invocations.length", 1)
        .commit ()

    .should ("create an secure server if the certificate are provided")
        .up (s =>
        {
            let MyHost = s.Host.defineSubclass ("MyHost");

            s.createArgs =
            {
                keepAliveTimeout: 0,
                stopTimeout: 0,
                hosts: new MyHost (
                {
                    names: "app.pushcorn.com",
                    certificate:
                    {
                        cert: CERTS_DIR.join ("pushcorn.com.crt"),
                        key: CERTS_DIR.join ("pushcorn.com.key")
                    }
                })
            };
        })
        .mock (
        {
            object: Server.http2,
            method: "createSecureServer",
            retval: () => new MockNodeHttpServer
        })
        .mock ("object", "info")
        .after (s => s.object.stop ())
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
            let MyHost = s.Host.defineSubclass ("MyHost");

            s.createArgs =
            {
                keepAliveTimeout: 0,
                stopTimeout: 0,
                http2: false,
                hosts: new MyHost (
                {
                    names: "app.pushcorn.com",
                    certificate:
                    {
                        cert: CERTS_DIR.join ("pushcorn.com.crt"),
                        key: CERTS_DIR.join ("pushcorn.com.key")
                    }
                })
            };
        })
        .mock (
        {
            object: Server.https,
            method: "createServer",
            retval: () => new MockNodeHttpServer
        })
        .mock ("object", "info")
        .after (s => s.object.stop ())
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
    .should ("shutdown the server if shutdown event was fired")
        .up (s => s.createArgs = { port: 0, stopTimeout: 0 })
        .after (s => s.instance.start ())
        .after (async () =>
        {
            for (let listener of process.listeners ("SIGTERM"))
            {
                await listener ();
            }
        })
        .after (s => s.instance.stop ())
        .mock ("instance", "info")
        .commit ()
;

// TODO: re-enable tests
// test.object ("http.Server")
    // .should ("properly handle the requests")
    // .application ()
    // .given (
    // {
        // port: 0,
        // stopTimeout: 0
    // })
    // .mock ("result", "info")
    // .after (async function ()
    // {
        // nit.ASSET_PATHS.unshift (this.app.root.path);

        // await this.app.root.createAsync ("public");

        // http.defineResponse ("Hello")
            // .info (200, "Hello")
            // .field ("<greeting>", "string")
        // ;
    // })
    // .after (async function ()
    // {
        // let server = this.server = this.result;

        // http.defineApi ("Hello")
            // .endpoint ("GET", "/hello")
            // .response ("http.responses.Hello")
            // .defineRequest (Request =>
            // {
                // Request.parameter ("name", "string");
            // })
            // .onRun (ctx => ctx.respond (`Hello ${ctx.request.name}!`)) ()
        // ;

        // const Service1 = http.defineService ("Service1", "http.services.FileServer");

        // let service1 = Service1.Descriptor.build (
        // {
            // name: "http:service1",
            // options: { template: true },
            // apis: "http:hello",
            // plugins:
            // [
                // "http:socket-io-server",
                // {
                    // name: "http:live-reload",
                    // options: { delay: 30 }
                // }
            // ]
        // });


        // server.hosts = { services: service1 };

        // await server.start ();
        // await nit.sleep (50);

        // this.port = server.realPort;
    // })
    // .after (async function ()
    // {
        // let res = await no_http_get (`http://127.0.0.1:${this.port}/hello?name=John`);

        // this.response1 = JSON.parse (await nit.readStream (res));
    // })
    // .after (async function ()
    // {
        // let client = new SocketIo.Client (`http://127.0.0.1:${this.port}`);

        // this.response2 = await client.fetchJson ("GET", "/hello", { name: "Jane" });

        // await client.close ();
    // })
    // .after (async function ()
    // {
        // let res = await no_http_get (`http://127.0.0.1:${this.port}/`);

        // this.response3 = await nit.readStream (res);
    // })
    // .after (async function ()
    // {
        // let client = new SocketIo.Client (`http://127.0.0.1:${this.port}`);
        // let file = nit.new ("nit.File", this.app.root.join ("public/index.html"));

        // await nit.sleep (200);

        // client.on ("message", (method, path, data) =>
        // {
            // this.response4 = { method, path, data };
        // });

        // await file.writeAsync ("NEW INDEX");
        // await nit.sleep (200);
        // await client.close ();
    // })
    // .after (async function ()
    // {
        // await this.server.stop ();
    // })
    // .expectingPropertyToBe ("response1.greeting", "Hello John!")
    // .expectingPropertyToBe ("response2.greeting", "Hello Jane!")
    // .expectingPropertyToBe ("response3", /nit server \d+\.\d+\.\d+/)
    // .expectingPropertyToBe ("response4", { method: "POST", path: "/live-reloads", data: undefined })
    // .commit ()
// ;


// test.method ("http.Server.Descriptor", "build")
    // .should ("build the server")
        // .up (s =>
        // {
            // s.createArgs =
            // {
                // options:
                // {
                    // port: 1234,
                    // keepAliveTimeout: 0,
                    // stopTimeout: 0
                // }
                // ,
                // hosts:
                // [
                // {
                    // names: "app.pushcorn.com",
                    // services: ["http:file-server"],
                    // certificate:
                    // {
                        // cert: CERTS_DIR.join ("pushcorn.com.crt"),
                        // key: CERTS_DIR.join ("pushcorn.com.key")
                    // }
                // }
                // ]
            // };
        // })
        // .returnsInstanceOf ("http.Server")
        // .expectingPropertyToBe ("result.port", 1234)
        // .expectingPropertyToBe ("result.hosts.0.services.length", 1)
        // .expectingPropertyToBeOfType ("result.hosts.0.services.0", "http.services.FileServer")
        // .expectingPropertyToBeOfType ("result.hosts.0.certificate", "http.Certificate")
        // .commit ()

    // .should ("able to create a server if only servcies or certificate are given")
        // .up (s =>
        // {
            // s.createArgs =
            // {
                // options:
                // {
                    // port: 1234,
                    // keepAliveTimeout: 0,
                    // stopTimeout: 0
                // }
                // ,
                // names: "app.pushcorn.com",
                // services: ["http:file-server"],
                // certificate:
                // {
                    // cert: CERTS_DIR.join ("pushcorn.com.crt"),
                    // key: CERTS_DIR.join ("pushcorn.com.key")
                // }
            // };
        // })
        // .returnsInstanceOf ("http.Server")
        // .expectingPropertyToBe ("result.port", 1234)
        // .expectingPropertyToBe ("result.hosts.0.services.length", 1)
        // .expectingPropertyToBeOfType ("result.hosts.0.services.0", "http.services.FileServer")
        // .expectingPropertyToBeOfType ("result.hosts.0.certificate", "http.Certificate")
        // .commit ()

    // .reset ()
        // .up (s =>
        // {
            // s.createArgs =
            // {
                // options:
                // {
                    // port: 1234,
                    // keepAliveTimeout: 0,
                    // stopTimeout: 0
                // }
                // ,
                // names: "app.pushcorn.com"
            // };
        // })
        // .returnsInstanceOf ("http.Server")
        // .expectingPropertyToBe ("result.port", 1234)
        // .expectingPropertyToBe ("result.hosts.0.names", ["app.pushcorn.com"])
        // .commit ()

    // .reset ()
        // .up (s =>
        // {
            // s.createArgs =
            // {
                // options:
                // {
                    // port: 1234,
                    // keepAliveTimeout: 0,
                    // stopTimeout: 0
                // }
                // ,
                // services: ["http:file-server"]
            // };
        // })
        // .returnsInstanceOf ("http.Server")
        // .expectingPropertyToBeOfType ("result.hosts.0.services.0", "http.services.FileServer")
        // .commit ()

    // .reset ()
        // .up (s =>
        // {
            // s.createArgs =
            // {
                // options:
                // {
                    // port: 1234,
                    // keepAliveTimeout: 0,
                    // stopTimeout: 0
                // }
                // ,
                // certificate:
                // {
                    // cert: CERTS_DIR.join ("pushcorn.com.crt"),
                    // key: CERTS_DIR.join ("pushcorn.com.key")
                // }
            // };
        // })
        // .returnsInstanceOf ("http.Server")
        // .expectingPropertyToBeOfType ("result.hosts.0.certificate", "http.Certificate")
        // .commit ()
// ;
