test.object (nit.require ("http.SocketIo"))
    .should ("define some basic socket.io classes")
    .expecting ("the property Server is socket.io.Server", true, (s) => s.class.Server == require ("socket.io").Server)
    .expecting ("the property Socket is socket.io.Socket", true, (s) => s.class.Socket == require ("socket.io").Socket)
    .expecting ("the property Namespace is socket.io.Namespace", true, (s) => s.class.Namespace == require ("socket.io").Namespace)
    .expecting ("the property Client is socket.io-client.io", true, (s) => s.class.Client == require ("socket.io-client").io)
    .expecting ("the property ClientSocket is socket.io-client.io", true, (s) => s.class.ClientSocket == require ("socket.io-client").Socket)
    .commit ()
;


test.method ("http.SocketIo.Client", "fetchText")
    .should ("return the response body as text")
    .mock ("object", "fetch", () => ({ body: "A string." }))
    .after (s => s.object.close ())
    .returns ("A string.")
    .commit ()
;


test.method ("http.SocketIo.Client", "fetchJson")
    .should ("return the response body as an object")
        .mock ("object", "fetch", () => ({ body: JSON.stringify ({ a: 1 })}))
        .returns ({ a: 1 })
        .after (s => s.object.close ())
        .commit ()

    .should ("return undefined if the JSON string is empty")
        .mock ("object", "fetch", () => ({ body: "" }))
        .returns ()
        .after (s => s.object.close ())
        .commit ()
;
