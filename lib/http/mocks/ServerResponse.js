module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.mocks.ServerResponse"))
        .use ("*stream.Writable")
        .extend (Self.Writable, nit.Class)
        .do (() => Self.classChain.splice (1, 0, ...nit.Class.classChain))
        .field ("statusCode", "integer")
        .field ("statusMessage", "string")
        .field ("headers", "object")
        .field ("data", "any")
        .field ("writableEnded", "boolean")

        .onConstruct (function ()
        {
            Self.Writable.call (this);
        })
        .method ("setHeader", function (k, v)
        {
            this.headers[k] = v;

            return this;
        })
        .method ("writeHead", function (statusCode, statusMessage, headers)
        {
            this.statusCode = statusCode;
            this.statusMessage = statusMessage;
            this.headers = headers;

            return this;
        })
        .method ("_write", function (chunk, encoding, next)
        {
            if (this.data)
            {
                this.data = Buffer.concat ([this.data, chunk]);
            }
            else
            {
                this.data = chunk;
            }

            next ();
        })
    ;
};
