module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.mocks.ServerResponse"))
        .use ("*stream")
        .extend (Self.stream.Writable, nit.Class)
        .field ("statusCode", "integer")
        .field ("statusMessage", "string")
        .field ("headers", "object")
        .field ("data", "any")

        .construct (function ()
        {
            Self.stream.Writable.call (this);
        })
        .method ("setHeader", function (k, v)
        {
            this.headers[k] = v;
        })
        .method ("_write", function (chunk, encoding, done)
        {
            if (this.data)
            {
                this.data = Buffer.concat ([this.data, chunk]);
            }
            else
            {
                this.data = chunk;
            }

            done ();
        })
    ;
};
