module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponseFilter ("BodyCompressor"))
        .use ("*stream")
        .use ("http.Etag")
        .condition ("http:request-accept-encoding", "gzip", "deflate", "br")
        .condition ("http:response-compressible")

        .field ("<threshold>", "integer", "The minimum content size in bytes to trigger compression.", 1024)

        .onApply (async function (ctx)
        {
            let
            {
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
            if (ctx.file
                && encoding == "gzip"
                && nit.path.extname (ctx.file) != ".gz"
                && nit.fs.existsSync (gzPath = ctx.file + ".gz"))
            {
                stream = nit.fs.createReadStream (gzPath);
                etag = await Self.Etag.forFile (ctx.file);
            }
            else
            if (body instanceof Self.stream)
            {
                let size;

                if (ctx.file)
                {
                    try
                    {
                        let stats = await nit.fs.promises.stat (ctx.file);

                        size = stats.size;
                        etag = Self.Etag.forStat (stats);
                    }
                    catch (e)
                    {
                    }
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
                    .responseHeader ("Content-Length", "")
                ;

                ctx.responseBody = stream;
            }
        })
    ;
};
