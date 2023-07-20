module.exports = function (nit, global)
{
    var writer = new nit.Object.Property.Writer;

    return nit.defineClass ("http.SocketIoClient")
        .field ("<path>", "string", "The path of the Socket.IO service.", "/socket.io")
        .field ("[forceNew]", "boolean", "Force a new connection.")
        .property ("socket", "any")
        .property ("disconnected", "boolean", { writer: writer })

        .onConstruct (function ()
        {
            var self = this;
            var socket = self.socket = global.io ({ path: self.path, forceNew: self.forceNew });

            socket.on ("disconnect", function (reason)
            {
                if (!self.disconnected && ~reason.indexOf ("disconnect"))
                {
                    socket.connect ();
                }
            });
        })
        .method ("disconnect", function ()
        {
            this.disconnected = writer.value (true);
            this.socket.disconnect ();
        })
        .method ("on", function (event, handler)
        {
            this.socket.on (event, handler);

            return this;
        })
    ;
};
