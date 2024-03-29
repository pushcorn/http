module.exports = function (nit, http)
{
    return http.defineResponseFilter ("CacheController")
        .orderAfter ("EtagBuilder")
        .condition ("http:request-method", "GET")
        .condition ("http:response-status", "2xx")

        .method ("notChanged", function (ctx)
        {
            let ifNoneMatch = ctx.req.headers["if-none-match"];
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
            let ifModifiedSince = ctx.req.headers["if-modified-since"];
            let lastModified = ctx.responseHeader ("Last-Modified");

            return !!(ifModifiedSince && lastModified == ifModifiedSince);
        })

        .onApply (function (ctx)
        {
            let lastModified = ctx.responseHeader ("Last-Modified");
            let etag = ctx.responseHeader ("ETag");

            if (etag && lastModified)
            {
                ctx.responseHeader ("Last-Modified", "");
            }

            if (!lastModified && !etag)
            {
                return;
            }

            if (!ctx.responseHeader ("Cache-Control"))
            {
                ctx.responseHeader ("Cache-Control", "no-cache");
            }

            if (etag && this.notChanged (ctx)
                || lastModified && this.notModified (ctx))
            {
                ctx.response = http.responseFor (304);
            }
        })
    ;
};
