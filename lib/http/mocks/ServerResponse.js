module.exports = function (nit)
{
    const no_stream = require ("stream");


    return nit.defineClass ("http.mocks.ServerResponse")
        .extend (no_stream.Writable, nit.Class)
        .field ("statusCode", "integer")
        .field ("statusMessage", "string")
        .field ("headers", "object")
        .field ("data", "any")

        .method ("setHeader", function (k, v)
        {
            this.headers[k] = v;
        })
        .method ("end", function (data)
        {
            this.data = data;
        })
    ;
};
