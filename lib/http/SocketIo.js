module.exports = function (nit)
{
    const socket_io = require ("socket.io");
    const socket_io_client = require ("socket.io-client");


    return nit.defineClass ("http.SocketIo")
        .registerInnerClass ("Server", socket_io.Server)
        .registerInnerClass ("Socket", socket_io.Socket)
        .registerInnerClass ("Namespace", socket_io.Namespace)
        .registerInnerClass ("Client", socket_io_client.io)
        .registerInnerClass ("ClientSocket", socket_io_client.Socket)
    ;
};
