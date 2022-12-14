module.exports = function (nit, http, Self)
{
    return (Self = http.response.defineFilter ("ContentHeadersBuilder"))
        .use ("http.MimeType")
        .use ("http.responses.FileReturned")

        .method ("apply", async function (ctx)
        {
            if (!ctx.responseHeader ("Content-Type"))
            {
                let ext = nit.path.extname (ctx.response instanceof Self.FileReturned ? ctx.response.path : ctx.path);

                if (ext)
                {
                    ctx.responseHeader ("Content-Type", Self.MimeType.lookup (ext).name);
                }
            }

            if (!ctx.responseHeader ("Content-Length")
                && ctx.response instanceof Self.FileReturned)
            {
                let stats = await nit.fs.promises.stat (ctx.response.path);

                ctx
                    .responseHeader ("Content-Length", stats.size)
                    .responseHeader ("Last-Modified", stats.mtime.toUTCString ())
                ;
            }
        })
    ;
};
