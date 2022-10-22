module.exports = function (nit, http, Self)
{
    return (Self = http.response.defineFilter ("BodyCompressor"))
        .use ("*stream")
        .use ("http.Etag")
        .use ("http.responses.FileReturned")
        .condition ("http:request-accept-encoding", "gzip", "deflate", "br")
        .condition ("http:response-compressible")

        .field ("<threshold>", "integer", "The minimum content size in bytes to trigger compression.", 1024)

        .method ("apply", async function (ctx)
        {
            let
            {
                response,
                responseEncoder: encoder,
                responseEncoding: encoding,
                responseBody: body

            } = ctx;

            if (!encoder)
            {
                return;
            }

            let threshold = this.threshold;
            let stream, gzPath, etag;

            if (nit.is.str (body) || nit.is.buffer (body))
            {
                if (body.length > threshold)
                {
                    stream = encoder ().end (body);
                    etag = Self.Etag.forData (body);
                }
            }
            else
            if (response instanceof Self.FileReturned
                && encoding == "gzip"
                && nit.path.extname (response.path) != ".gz"
                && nit.fs.existsSync (gzPath = response.path + ".gz"))
            {
                stream = nit.fs.createReadStream (gzPath);
                etag = await Self.Etag.forFile (response.path);
            }
            else
            if (body instanceof Self.stream)
            {
                let size;

                if (response instanceof Self.FileReturned)
                {
                    let stats = await nit.fs.promises.stat (response.path);

                    size = stats.size;
                    etag = Self.Etag.forStat (stats);
                }

                if (!size || size > threshold)
                {
                    stream = body.pipe (encoder ());
                }
            }

            if (stream)
            {
                let oldEtag = ctx.responseHeader ("ETag");

                if (etag || oldEtag)
                {
                    ctx.responseHeader ("ETag", (etag || oldEtag).slice (0, -1) + "-" + encoding[0] + '"');
                }

                ctx
                    .vary ("Accept-Encoding")
                    .responseHeader ("Content-Encoding", encoding)
                ;

                ctx.responseBody = stream;
            }
        })
    ;
};
