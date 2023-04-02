const http = nit.require ("http");
const no_http = require ("http");
const no_http_get = nit.promisify (no_http, "get", true);
const SocketIo = nit.require ("http.SocketIo");
const HelloResponse = http.defineResponse ("HelloResponse")
    .info (200, "Hello")
    .field ("<greeting>", "string")
;

const TestService = nit.defineClass ("TestService", "http.Service")
    .servicePlugin ("http:socket-io-server", "/ws")
    .servicePlugin ("http:file-server")
    .defineInnerClass ("HelloHandler", "http.Handler", HelloHandler =>
    {
        HelloHandler
            .defineRequest (Request =>
            {
                Request
                    .parameter ("<name>", "string")
                ;
            })
            .run (function (ctx)
            {
                ctx.response = new HelloResponse (`Hello ${ctx.request.name}!`);
            })
        ;
    })
    .defineInnerClass ("PongResponse", "http.Response", PongResponse =>
    {
        PongResponse
            .info (200, "Pong")
        ;
    })
    .get ("/hello", "TestService.HelloHandler")

    .soGet ("/ping", async function (ctx)
    {
        ctx.send (new TestService.PongResponse);
    })
    .soGet ("/err", async function ()
    {
        throw new Error ("ERR!");
    })
;


test.command ("http.commands.Server")
    .should ("start the HTTP server")
        .given ({ port: 0, services: ["@TestService"] })
        .after (async function ()
        {
            let lock = nit.Deferred ();

            this.object.server.nodeServer.on ("listening", () =>
            {
                this.port = this.object.server.nodeServer.address ().port;

                lock.resolve ();
            });

            await lock;

            this.requests = [];
            this.soRequests = [];
        })
        .after (async function ()
        {
            let res = await no_http_get (`http://127.0.0.1:${this.port}/hello`);

            this.requests.push (
            {
                status: res.statusCode,
                body: JSON.parse (await nit.readStream (res))
            });
        })
        .after (async function ()
        {
            let res = await no_http_get (`http://127.0.0.1:${this.port}/hello?name=John`);

            this.requests.push (
            {
                status: res.statusCode,
                body: JSON.parse (await nit.readStream (res))
            });
        })
        .after (async function ()
        {
            let res = await no_http_get (`http://127.0.0.1:${this.port}/ping`);

            this.requests.push (
            {
                status: res.statusCode,
                body: JSON.parse (await nit.readStream (res))
            });
        })
        .after (async function ()
        {
            let client = this.client = new SocketIo.Client (`http://127.0.0.1:${this.port}`,
            {
                path: "/ws",
                extraHeaders:
                {
                    "x-access-token": "test123"
                }
            });

            client.send = nit.promisify (client, "send", true);

            this.soRequests.push (
            {
                response: await client.send ("GET", "/ping")
            });
        })
        .after (async function ()
        {
            this.soRequests.push (
            {
                response: await this.client.send ("GET", "/pong")
            });
        })
        .after (async function ()
        {
            this.soRequests.push (
            {
                response: await this.client.send ("GET", "/err")
            });
        })
        .down (async function ()
        {
            await this.client.disconnect ();
            await this.object.server.stop ();
        })
        .mock (http.Server.prototype, "info")
        .mock (TestService.prototype, "error")
        .mock (http.Server.prototype, "error")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "info.server_started")
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", "error.unexpected_error")
        .expectingPropertyToBe ("context.input.port", 0)
        .expecting ("port", true, (s) => s.port > 80)
        .expectingPropertyToBeOfType ("object.server.services.0", "TestService")
        .expectingPropertyToBe ("requests.0.status", 500)
        .expectingPropertyToBe ("requests.0.body.@name", "InternalServerError")
        .expectingPropertyToBe ("requests.1.status", 200)
        .expectingPropertyToBe ("requests.1.body.@name", "HelloResponse")
        .expectingPropertyToBe ("requests.1.body.greeting", "Hello John!")
        .expectingPropertyToBe ("requests.2.status", 404)
        .expectingPropertyToBe ("soRequests.0.response.@name", "PongResponse")
        .expectingPropertyToBe ("soRequests.1.response.@name", "NotFound")
        .expectingPropertyToBe ("soRequests.1.response.@status", 404)
        .expectingPropertyToBe ("soRequests.2.response.@status", 500)
        .commit ()
;


test.object ("http.commands.Server.Input")
    .should ("have http.services.File as the default service")
    .expectingPropertyToBeOfType ("result.services.0", "http.services.File")
    .commit ()
;
