module.exports = function (nit, http)
{
    return http.defineResponse ("http.responses.Text")
        .info (200, "")
        .field ("[text]", "string", "The text content.")
        .method ("toBody", function (ctx)
        {
            ctx.responseHeader ("Content-Type", "text/plain");

            return this.text;
        })
    ;
};
