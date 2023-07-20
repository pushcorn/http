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

        .do ("ClientSocket.prototype", proto =>
        {
            nit.assign (proto,
            {
                fetch: nit.promisify (proto.send, true)
                ,
                fetchText: async function ()
                {
                    let response = await this.fetch (...arguments);

                    return response.body;
                }
                ,
                fetchJson: async function ()
                {
                    let text = await this.fetchText (...arguments);

                    return text.length ? JSON.parse (text) : undefined;
                }
            });
        })
    ;
};
