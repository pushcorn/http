module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.mocks.IncomingMessage"))
        .use ("*stream.Readable")
        .extend (http.IncomingMessage, nit.Class)
        .do (() => Self.classChain.splice (1, 0, ...nit.Class.classChain))
        .field ("<method>", "string", "The request method.")
            .constraint ("choice", "GET", "POST", "PUT", "DELETE", "HEAD", "PATCH", "OPTIONS")
        .field ("<url>", "string", "The request URL.")
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
        .onConstruct (function ()
        {
            Self.Readable.call (this);

            this.headers.host = this.headers.host || this.parsedUrl?.host;
        })
    ;
};
