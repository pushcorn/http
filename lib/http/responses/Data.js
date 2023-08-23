module.exports = function (nit, http)
{
    return http.defineResponse ("http.responses.Data")
        .info (200, "OK")
        .field ("[data]", "any", "The data content.")
            .constraint ("type", "string", "Buffer")
        .field ("[contentType]", "string", "The content type.", "application/octet-stream")

        .method ("toBody", function (ctx)
        {
            ctx.responseHeader ("Content-Type", this.contentType);

            return this.data;
        })
    ;
};
