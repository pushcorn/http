module.exports = function (nit, global, Self)
{
    return (Self = nit.defineClass ("http.LiveReload"))
        .use ("http.SocketIoClient")
        .field ("[path]", "string?", "The path of the Socket.IO service.")
        .field ("[reloadOnReconnect]", "boolean", "Whether to reload the browser after reconnect.", true)

        .staticMemo ("instance", function ()
        {
            return new Self;
        })
        .property ("client", "http.SocketIoClient")

        .method ("start", function ()
        {
            var self = this;
            var client = self.client = new Self.SocketIoClient (self.toPojo ());

            client.on ("message", function (method, path)
            {
                if (method == "POST" && path == "/live-reloads")
                {
                    self.reload ();
                }
            });

            if (self.reloadOnReconnect)
            {
                client.socket.io.on ("reconnect", function ()
                {
                    self.reload ();
                });
            }
        })
        .method ("reload", function ()
        {
            this.client.disconnect ();
            location.reload ();
        })
        .do (function ()
        {
            nit.ready (function ()
            {
                Self.instance.start ();
            });
        })
    ;
};
