module.exports = function (nit)
{
    return nit.defineClass ("http.mocks.NodeHttpServer")
        .field ("listenerMap", "object")
        .field ("port", "integer")
        .field ("address", "string")
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
        .method ("removeAllListeners", function (event)
        {
            if (event)
            {
                delete this.listenerMap[event];
            }
            else
            {
                this.listenerMap = {};
            }
        })
        .method ("listen", function (port, address, cb)
        {
            this.listening = true;
            this.port = port;
            this.address = address;

            nit.invoke (cb);

            return this;
        })
        .method ("close", function (cb)
        {
            cb ();
        })
    ;
};
