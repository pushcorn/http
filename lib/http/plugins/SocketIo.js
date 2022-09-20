module.exports = function (nit, http)
{
    const writer = new nit.Object.Property.Writer ();


    return nit.defineClass ("http.plugins.SocketIo", "http.Server.Plugin")
        .require ("http.SocketIo")
        .field ("[exportAs]", "string", "The server property name to use for the Socket.IO object.", "io")

        .staticMethod ("onRegisterPlugin", function (hostCls, plugin)
        {
            hostCls.property (plugin.exportAs, "http.SocketIo.Server", { writer });
        })

        .method ("onStart", function (server)
        {
            server.io = writer.value (new http.SocketIo.Server (server.nodeServer));
        })
        .method ("onStop", function (server)
        {
            let { io } = server;

            if (io)
            {
                io.engine.close ();

                nit.each (io.sockets.connected, function (socket)
                {
                    socket.disconnect ();
                });
            }
        })
    ;
};
