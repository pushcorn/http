module.exports = function (nit)
{
    return nit.test.defineMock ("http.MockNodeHttpServer")
        .field ("listeners", "object")
        .field ("port", "integer")
        .field ("address", "string")
        .field ("listening", "boolean")

        .method ("on", function (event, listener)
        {
            this.listeners[event] = listener;

            return this;
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
