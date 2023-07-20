module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponse ("http.responses.RequestFailed"))
        .info (500, "Sorry, we are unable to process your request right now. Please try again later.")
        .field ("code", "string?", "The error code.")
        .field ("[data]", "any", "The response data.")
        .field ("[dataOnly]", "boolean?", "Whether to return the data only.")

        .method ("toBody", function (ctx)
        {
            return Self.superclass.prototype.toBody.call (this, ctx, this.dataOnly ? "data" : "");
        })
    ;
};
