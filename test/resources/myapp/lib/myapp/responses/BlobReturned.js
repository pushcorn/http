module.exports = function (nit, http)
{
    return http.defineResponse ("myapp.responses.BlobReturned")
        .info (200, "The blob has been returned.")
        .meta ("contentType", "application/octet-stream")
        .field ("<content>", "any")
        .method ("toBody", function (ctx)
        {
            ctx.responseHeader ("Content-Type", this.constructor.contentType);

            return this.content;
        })
    ;
};
