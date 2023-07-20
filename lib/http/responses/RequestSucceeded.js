module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponse ("RequestSucceeded"))
        .info (200, "The request has been fulfilled.")
        .field ("[data]", "any", "The response data.")
        .field ("[dataOnly]", "boolean?", "Whether to return the data only.")

        .method ("toBody", function (ctx)
        {
            return Self.superclass.prototype.toBody.call (this, ctx, this.dataOnly ? "data" : "");
        })
    ;
};
