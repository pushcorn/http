module.exports = function (nit, http)
{
    return http.defineService ("FileServer")
        .serviceplugin ("http:file-server")
        .field ("<compileAssets>", "boolean", "Whether to compile asset files.")
        .init (function ()
        {
            if (this.compileAssets)
            {
                this.contextClass
                    .responsefilter ("http:template-renderer", "text/html")
                    .responsefilter ("http:template-renderer", "text/css", "/*{", "}*/")
                    .responsefilter ("http:css-compiler")
                ;
            }
        })
    ;
};
