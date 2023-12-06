test.object ("http.services.LiveReload")
    .should ("watch public dirs by default")
        .expecting ("the dirs property should contain an array of public dirs", true, function (s)
        {
            return s.result.dirs.every (d => d.endsWith ("/public"));
        })
        .commit ()
;


test.method ("http.services.LiveReload", "postStart")
    .should ("throw if the SocketIo service was not enabled")
        .before (s =>
        {
            s.object.host = new s.http.Host;
        })
        .throws ("error.socket_io_required")
        .commit ()

    .should ("start the dir watcher")
        .before (s =>
        {
            s.object.host = new s.http.Host;
            s.object.host.services.push ("http:socket-io");
            s.socketIoService = s.object.host.services[0];

            nit.dpv (s.socketIoService, "io",
            {
                sockets:
                {
                    send: nit.noop
                }
            });

            let watcher =
            {
                id: 123,
                on: (event, listener) =>
                {
                    s.listener = listener;

                    return watcher;
                }
            };

            s.object.delay = 10;
            s.mocks.push (new nit.test.Strategy.Mock (
            {
                object: s.class.chokidar,
                method: "watch",
                retval: watcher
            }));
        })
        .mock ("socketIoService.sockets", "send")
        .after (async (s) =>
        {
            s.listener ();

            await nit.sleep (50);
        })
        .expectingPropertyToBe ("object.watcher.id", 123)
        .expectingPropertyToBe ("mocks.0.invocations.0.args", ["POST", "/live-reloads"])
        .commit ()
;


test.method ("http.services.LiveReload", "preStop")
    .should ("stop the dir watcher")
        .before (s =>
        {
            s.object.watcher =
            {
                close: () =>
                {
                    s.closed = true;
                }
            };
        })
        .expectingPropertyToBe ("closed", true)
        .commit ()
;
