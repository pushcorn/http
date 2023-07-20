module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.mocks.SocketIoClientSocket"))
        .defineInnerClass ("Manager", Manager =>
        {
            Manager
                .property ("listeners", "object")
                .method ("on", function (event, listener)
                {
                    this.listeners[event] = listener;
                })
            ;
        })
        .field ("options", "object")
        .property ("listeners", "object")
        .property ("reconnectCount", "integer")
        .property ("disconnectCount", "integer")
        .property ("io", Self.name + ".Manager")

        .onConstruct (function ()
        {
            this.io = new Self.Manager;
        })
        .method ("on", function (event, listener)
        {
            this.listeners[event] = listener;
        })
        .method ("connect", function ()
        {
            this.reconnectCount++;
        })
        .method ("disconnect", function ()
        {
            this.disconnectCount++;
            this.listeners.disconnect?. ("io client disconnect");
        })
    ;
};



