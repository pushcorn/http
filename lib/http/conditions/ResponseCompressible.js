module.exports = function (nit, http, Self)
{
    return (Self = http.defineCondition ("ResponseCompressible"))
        .use ("http.MimeType")

        .onCheck (function (ctx)
        {
            let contentType = ctx.responseHeader ("Content-Type");
            let mime = Self.MimeType.lookup (contentType);

            return !!(mime
                && mime.compressible
                && mime.name.match (/^(text|application)/))
            ;
        })
    ;
};
