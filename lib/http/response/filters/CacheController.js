module.exports = function (nit, http)
{
    return http.response.defineFilter ("CacheController")
        .condition ("http:request-method", "GET")
        .condition ("http:no-request-header-value", "Cache-Control", "no-cache")
        .condition ("http:response-status", "2xx")

        .method ("notChanged", function (ctx)
        {
            let ifNoneMatch = ctx.headerParams["if-none-match"];
            let etag = ctx.responseHeader ("ETag");

            return !!(etag && nit.trim (ifNoneMatch)
                .split (/\s*,\s*/)
                .some (function (value)
                {
                    return value == "*" || value === etag;
                }))
            ;
        })
        .method ("notModified", function (ctx)
        {
            let ifModifiedSince = ctx.headerParams["if-modified-since"];
            let lastModified = ctx.responseHeader ("Last-Modified");

            return !!(ifModifiedSince && lastModified == ifModifiedSince);
        })

        .method ("apply", function (ctx)
        {
            let lastModified = ctx.responseHeader ("Last-Modified");
            let etag = ctx.responseHeader ("ETag");

            if (!lastModified && !etag)
            {
                return;
            }

            if (!ctx.responseHeader ("Cache-Control"))
            {
                ctx.responseHeader ("Cache-Control", "max-age=0, must-revalidate");
            }

            if (etag && this.notChanged (ctx)
                || lastModified && this.notModified (ctx))
            {
                ctx.response = http.responseFor (304);
            }
        })
    ;
};
