module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponse ("http.responses.RequestFailed"))
        .info (400, "Bad Request")
        .field ("code", "string?", "The error code.")
        .field ("[data]", "any", "The response data.")
        .field ("[dataOnly]", "boolean?", "Whether to return the data only.")

        .method ("toBody", function (ctx)
        {
            return Self.superclass.prototype.toBody.call (this, ctx, this.dataOnly ? "data" : "");
        })
    ;
};
