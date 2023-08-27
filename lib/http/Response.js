module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.Response"))
        .use (["statusCodes", "resources/http/status-codes.json"])
        .categorize ("http.responses")
        .defineMeta ("contentType", "string", "application/json")
        .defineMeta ("status", "integer")
        .defineMeta ("message", "string")
        .defineMeta ("code", "string?") // The error code that the response represent.

        .staticMethod ("info", function (status, message, code, contentType) // eslint-disable-line no-unused-vars
        {
            ({ status, message, code, contentType } = nit.typedArgsToObj (arguments,
            {
                status: "integer",
                message: "string",
                code: "string",
                contentType: "string"
            }));

            message = message || Self.statusCodes[status];

            return this.meta ({ status, message, code, contentType });
        })
        .method ("toBody", function (ctx, property)
        {
            let cls = this.constructor;

            if (cls.fields.length)
            {
                ctx.responseHeader ("Content-Type", cls.contentType);

                return nit.toJson (nit.get (this.toPojo (), property));
            }
            else
            {
                return "";
            }
        })
    ;
};
