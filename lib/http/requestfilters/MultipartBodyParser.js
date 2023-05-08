module.exports = function (nit, http, Self)
{
    return (Self = http.defineRequestFilter ("MultipartBodyParser"))
        .use ("*formidable")
        .condition ("http:request-content-type", "multipart/form-data")

        .field ("keepExtensions", "boolean", "Whether to keep the extension for the tmp file.", true)
        .field ("maxFileSize", "integer", "The maximum file size.", 100 * 1000 * 1000)
        .field ("maxFieldSize", "integer", "The maximum field size.", 10 * 1000 * 1000)

        .method ("apply", async function (ctx)
        {
            ctx.requestBody = await new Promise ((res, rej) =>
            {
                Self
                    .formidable (Self.toPojo ())
                    .parse (ctx.requestStream, function (error, fields, files)
                    {
                        if (error)
                        {
                            rej (error);
                        }
                        else
                        {
                            res ({ fields, files });
                        }
                    })
                ;
            });
        })
    ;
};
