test.object ("http.SocketIoClient")
    .should ("create a connecting socket to the server")
    .given ("/ws", true)
    .mock (
    {
        object: global,
        method: "io",
        retval: function (options)
        {
            return nit.new ("http.mocks.SocketIoClientSocket", { options });
        }
    })
    .after (function ()
    {
        this.reconnectCounts = [];
        this.disconnectCounts = [];

        let socket = this.result.socket;

        socket.listeners.disconnect ("unknown");

        this.reconnectCounts.push (socket.reconnectCount);
        this.disconnectCounts.push (socket.disconnectCount);

        socket.listeners.disconnect ("io server disconnect");

        this.reconnectCounts.push (socket.reconnectCount);
        this.disconnectCounts.push (socket.disconnectCount);

        socket.listeners.disconnect ("io client disconnect");

        this.reconnectCounts.push (socket.reconnectCount);
        this.disconnectCounts.push (socket.disconnectCount);

        this.result.disconnect ();

        this.reconnectCounts.push (socket.reconnectCount);
        this.disconnectCounts.push (socket.disconnectCount);

        this.result.on ("connect", function () { /* CONNECT */ });
    })
    .expectingPropertyToBe ("result.socket.options", { forceNew: true, path: "/ws" })
    .expectingPropertyToBe ("reconnectCounts", [0, 1, 2, 2])
    .expectingPropertyToBe ("disconnectCounts", [0, 0, 0, 1])
    .expectingPropertyToBe ("result.disconnected", true)
    .expectingMethodToReturnValue ("result.socket.listeners.connect.toString", /CONNECT/)
    .commit ()
;
