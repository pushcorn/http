const LiveReload = nit.require ("http.serviceplugins.LiveReload");
const SocketIoServer = nit.require ("http.serviceplugins.SocketIoServer");
const http = nit.require ("http");
const no_http = require ("http");


function newServiceClass (usePlugin)
{
    return nit.do (nit.defineClass ("TestService", "http.Service", true), usePlugin === false ? nit.noop : LiveReload.onUsePlugin);
}

function newService (initSocketServer)
{
    const Service = new newServiceClass (true);
    let service = new Service;

    service.server = new http.Server;
    service.server.nodeServer = no_http.createServer ();
    service.contextClass = nit.defineClass ("ServiceContext", "http.Context");

    if (initSocketServer !== false)
    {
        let socketIoServer = new SocketIoServer;

        SocketIoServer.onUsePlugin (Service);
        socketIoServer.preInit (service);
    }

    return service;
}


test.method ("http.serviceplugins.LiveReload", "onUsePlugin", true)
    .should ("add the liveReloadEnabled property")
    .given (newServiceClass (false))
    .after (s =>
    {
        s.service = new s.args[0];
    })
    .expectingPropertyToBe ("service.liveReloadEnabled", true)
    .commit ()
;


test.object ("http.serviceplugins.LiveReload")
    .should ("watch public dirs by default")
    .expecting ("the dirs property should contain an array of public dirs", true, function (s)
    {
        return s.result.dirs.every (d => d.endsWith ("/public"));
    })
    .commit ()
;


test.method ("http.serviceplugins.LiveReload", "postStart")
    .should ("start the dir watcher")
        .given (newService ())
        .before (function ()
        {
            let watcher =
            {
                id: 123,
                on: (event, listener) =>
                {
                    this.listener = listener;

                    return watcher;
                }
            };

            this.object.delay = 10;
            this.mocks.push (new nit.test.Strategy.Mock (
            {
                object: LiveReload.chokidar,
                method: "watch",
                retval: watcher
            }));
        })
        .mock ("args.0.socketIo.io.sockets", "send")
        .after (async function ()
        {
            this.listener ();

            await nit.sleep (50);
        })
        .expectingPropertyToBe ("object.watcher.id", 123)
        .expectingPropertyToBe ("mocks.0.invocations.0.args", ["POST", "/live-reloads"])
        .commit ()

    .should ("throw if the SocketIoServer plugin was not enabled")
        .given (newService (false))
        .throws ("error.socket_io_required")
        .commit ()
;


test.method ("http.serviceplugins.LiveReload", "preStop")
    .should ("stop the dir watcher")
    .before (function ()
    {
        this.object.watcher =
        {
            close: () =>
            {
                this.closed = true;
            }
        };
    })
    .expectingPropertyToBe ("closed", true)
    .commit ()
;
