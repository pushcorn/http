module.exports = function (nit, http)
{
    return http.defineResponse ("http.responses.Text")
        .info (200, "")
        .field ("[text]", "string", "The text content.")
        .field ("[contentType]", "string", "The content type.", "text/plain")
        .method ("toBody", function (ctx)
        {
            ctx.responseHeader ("Content-Type", this.contentType);

            return this.text;
        })
    ;
};
