module.exports = function (nit, http)
{
    return http.defineResponse ("File")
        .info (200, "OK")
        .field ("<path>", "file", "The file path.")
        .field ("[contentType]", "string", "The content type.")

        .method ("toBody", async function (ctx)
        {
            let { path, contentType } = this;
            let file;

            if (nit.path.isAbsolute (path))
            {
                path = "file://" + path;
            }

            if (!(file = await ctx.resolveAsset (path)))
            {
                this.throw ("error.file_not_found", { path });
            }

            ctx.file = file;

            if (contentType)
            {
                ctx.responseHeader ("Content-Type", contentType);
            }

            return nit.fs.createReadStream (file);
        })
    ;
};
