module.exports = function (nit, http)
{
    return http.defineResponse ("http.responses.Json")
        .info (200, "OK")
        .field ("[json]", "any", "The JSON content.")
        .field ("[contentType]", "string", "The content type.", "application/json")
        .method ("toBody", function (ctx)
        {
            ctx.responseHeader ("Content-Type", this.contentType);

            return nit.toJson (this.json);
        })
    ;
};
