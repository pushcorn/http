module.exports = function (nit)
{
    return nit.defineClass ("http.mocks.NodeHttpServer")
        .field ("listenerMap", "object")
        .field ("port", "integer")
        .field ("addr", "string")
        .field ("listening", "boolean")

        .method ("on", function (event, listener)
        {
            this.listenerMap[event] = listener;

            return this;
        })
        .method ("listeners", function (event)
        {
            return nit.array (this.listenerMap[event]);
        })
        .method ("removeAllListeners", function ()
        {
            this.listenerMap = {};
        })
        .method ("listen", function (port, address, cb)
        {
            this.listening = true;
            this.port = port || 80;
            this.addr = address || "0.0.0.0";

            nit.invoke (cb);

            return this;
        })
        .method ("address", function ()
        {
            return { address: this.addr, port: this.port };
        })
        .method ("close", function (cb)
        {
            cb ();
        })
    ;
};
