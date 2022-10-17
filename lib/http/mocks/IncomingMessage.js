module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.mocks.IncomingMessage"))
        .use ("*stream")
        .extend (http.IncomingMessage, nit.Class)
        .field ("<method>", "string", "The request method.")
            .constraint ("choice", "GET", "POST", "PUT", "DELETE", "HEAD")
        .field ("<path>", "string", "The request path.")
        .field ("url", "string", "The request URL.",
        {
            getter: function (v)
            {
                return v || this.path;
            }
        })
        .field ("httpVersion", "string", "The HTTP version used.", "1.1")
        .field ("headers", "object")
        .field ("cookies", "object")
        .field ("data", "object")
        .field ("socket", "any",
        {
            defval: function ()
            {
                return nit.new ("http.mocks.Socket");
            }
        })
        .construct (function ()
        {
            Self.stream.Readable.call (this);
        })
    ;
};
