let reloadCount = 0;
let readyCallback;

test.mock (nit, "ready", function (cb)
{
    readyCallback = cb;
});

global.location =
{
    reload: function ()
    {
        reloadCount++;
    }
};


test.object ("http.LiveReload")
    .should ("connect to the server and reload the browser on live-reload message")
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
        readyCallback ();

        this.result = this.class.instance;
        this.reloadCounts = [];

        this.result.client.socket.listeners.message ("GET", "/test");
        this.reloadCounts.push (reloadCount);

        this.result.client.socket.listeners.message ("POST", "/live-reloads");
        this.reloadCounts.push (reloadCount);

        this.result.client.socket.io.listeners.reconnect ();
        this.reloadCounts.push (reloadCount);
    })
    .expectingPropertyToBe ("reloadCounts", [0, 1, 2])
    .commit ()
;


test.method ("http.LiveReload", "start",
    {
        createArgs: { reloadOnReconnect: false }
    })
    .should ("not register the reconnect listener if reloadOnReconnect is false")
    .mock (
    {
        object: global,
        method: "io",
        retval: function (options)
        {
            return nit.new ("http.mocks.SocketIoClientSocket", { options });
        }
    })
    .expectingPropertyToBe ("object.client.socket.io.listeners.reconnect", undefined)
    .commit ()
;
