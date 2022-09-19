module.exports = function (nit)
{
    return nit.defineClass ("http.mocks.Socket")
        .field ("id", "string")
        .field ("keepAlive", "boolean")
        .field ("timeout", "integer")
        .field ("listeners", "object")
        .field ("ended", "boolean")
        .field ("readyState", "string")
        .field ("requests...", "any", "The open requests.")

        .method ("on", function (event, listener)
        {
            this.listeners[event] = listener;

            return this;
        })
        .method ("setKeepAlive", function (keepAlive)
        {
            this.keepAlive = keepAlive;
        })
        .method ("setTimeout", function (timeout)
        {
            this.timeout = timeout;
        })
        .method ("end", function (cb)
        {
            this.ended = true;

            nit.invoke (this.listeners.end);
            nit.invoke (this.listeners.close);
            nit.invoke (cb);

            return this;
        })
    ;
};
