module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponseFilter ("EtagBuilder"))
        .use ("http.Etag")
        .orderAfter ("BodyCompressor")
        .condition ("http:request-method", "GET")
        .condition ("http:no-response-header", "ETag")
        .condition ("http:response-status", "2xx")

        .onApply (async function (ctx)
        {
            let etag;
            let body = ctx.responseBody;

            if (nit.is.str (body) || nit.is.buffer (body))
            {
                etag = Self.Etag.forData (body);
            }
            else
            if (ctx.file)
            {
                try
                {
                    let stats = await nit.fs.promises.stat (ctx.file);

                    etag = Self.Etag.forStat (stats);
                }
                catch (e)
                {
                }
            }

            if (etag)
            {
                ctx.responseHeader ("ETag", etag);
            }
        })
    ;
};
