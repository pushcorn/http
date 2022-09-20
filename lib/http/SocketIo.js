module.exports = function (nit)
{
    const socket_io = require ("socket.io");


    return nit.defineClass ("http.SocketIo")
        .registerInnerClass ("Server", socket_io.Server)
        .registerInnerClass ("Socket", socket_io.Socket)
        .registerInnerClass ("Namespace", socket_io.Namespace)
    ;
};
