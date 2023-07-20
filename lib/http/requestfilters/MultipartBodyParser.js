module.exports = function (nit, http, Self)
{
    return (Self = http.defineRequestFilter ("MultipartBodyParser"))
        .use ("*formidable.formidable")
        .use ("*formidable.IncomingForm")
        .condition ("http:request-content-type", "multipart/form-data")

        .field ("keepExtensions", "boolean", "Whether to keep the extension for the tmp file.", true)
        .field ("maxFileSize", "integer", "The maximum file size.", 100 * 1000 * 1000)
        .field ("maxFieldSize", "integer", "The maximum field size.", 10 * 1000 * 1000)

        .onApply (async function (ctx)
        {
            let [fields, files] = await Self.formidable (this.toPojo ()).parse (ctx.requestStream);

            ctx.requestBody = { fields, files };
        })
    ;
};
