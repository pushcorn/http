module.exports = function (nit)
{
    return nit.defineClass ("http.services.File", "http.Service")
        .defineContext (Context =>
        {
            Context
                .responseFilter ("http:template-renderer", "text/html")
                .responseFilter ("http:template-renderer", "text/css", "/*{", "}*/")
                .responseFilter ("http:css-compiler")
            ;
        })
        .servicePlugin ("http:file-server")
    ;
};
