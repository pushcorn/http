module.exports = function (nit)
{
    return nit.defineClass ("http.Response")
        .categorize ("http.responses")
        .meta ("status", "integer", 404)
        .meta ("message", "string", "Not Found")
        .meta ("code", "string?") // The error code that the response represent.

        .staticMethod ("info", function (status, message, code) // eslint-disable-line no-unused-vars
        {
            return this.assignStatic ({ status, message, code });
        })
        .method ("toBody", function (ctx, property)
        {
            let cls = this.constructor;

            if (cls.fields.length)
            {
                ctx.responseHeader ("Content-Type", "application/json");

                return nit.toJson (nit.get (this.toPojo (), property));
            }
            else
            {
                return "";
            }
        })
    ;
};
