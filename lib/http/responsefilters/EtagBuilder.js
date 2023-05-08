module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponseFilter ("EtagBuilder"))
        .use ("http.Etag")
        .use ("http.responses.FileReturned")
        .condition ("http:request-method", "GET")
        .condition ("http:no-response-header", "ETag")
        .condition ("http:response-status", "2xx")

        .method ("apply", async function (ctx)
        {
            let etag;
            let body = ctx.responseBody;

            if (nit.is.str (body) || nit.is.buffer (body))
            {
                etag = Self.Etag.forData (body);
            }
            else
            if (ctx.response instanceof Self.FileReturned)
            {
                let stats = await nit.fs.promises.stat (ctx.response.path);

                etag = Self.Etag.forStat (stats);
            }

            if (etag)
            {
                ctx.responseHeader ("ETag", etag);
            }
        })
    ;
};
