module.exports = function (nit)
{
    return nit.defineClass ("http.Route")
        .field ("<method>", "string", "The request method.")
            .constraint ("choice", "GET", "POST", "PUT", "DELETE", "HEAD")
        .field ("<path>", "string", "The request path.")

        .property ("pathParser", "http.PathParser")

        .construct (function ()
        {
            this.pathParser = nit.new ("http.PathParser", this.path);
        })
        .method ("parse", function (path)
        {
            return this.pathParser.parse (path);
        })
    ;
};
