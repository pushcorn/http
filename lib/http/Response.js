module.exports = function (nit)
{
    return nit.defineClass ("http.Response")
        .categorize ("http.responses")
        .staticProperty ("STATUS", "integer", 404)
        .staticProperty ("MESSAGE", "string", "Not Found")

        .field ("@name", "string", "The response name.", function (prop, owner)
        {
            return owner.constructor.simpleName;
        })
        .field ("@status", "integer", "The response status code.", function (prop, owner)
        {
            return owner.constructor.STATUS;
        })
        .field ("@message", "string", "The response status message.", function (prop, owner)
        {
            return owner.constructor.MESSAGE;
        })

        .staticMethod ("info", function (status, message) // eslint-disable-line no-unused-vars
        {
            this.STATUS = status;
            this.MESSAGE = message;

            return this;
        })
        .method ("toBody", function (ctx)
        {
            ctx.responseHeader ("Content-Type", "application/json");

            return nit.toJson (this.toPojo ());
        })
    ;
};
