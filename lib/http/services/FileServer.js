module.exports = function (nit, http)
{
    return http.defineService ("FileServer")
        .field ("[compileAssets]", "boolean", "Whether to compile asset files.")
        .field ("roots...", "dir?", "The document roots.")
        .field ("indexes...", "string?", "The index files.")

        .onConstruct (function ()
        {
            this.constructor.serviceplugin ("http:file-server",
            {
                roots: this.roots,
                indexes: this.indexes
            });
        })
        .onInit (function ()
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
