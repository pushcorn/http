module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.Response"))
        .use ("*stream")
        .categorize ()
        .staticProperty ("STATUS", "integer", 404)
        .staticProperty ("MESSAGE", "string", "Not Found")

        .staticMethod ("info", function (status, message) // eslint-disable-line no-unused-vars
        {
            this.STATUS = status;
            this.MESSAGE = message;

            return this;
        })
        .method ("toPojo", function ()
        {
            let cls = this.constructor;
            let pojo = Self.invokeParentMethod (this, "toPojo");
            let meta =
            {
                "@name": cls.simpleName,
                "@status": cls.STATUS,
                "@message": cls.MESSAGE
            };

            return nit.assign (meta, pojo);
        })
        .method ("toBody", function ()
        {
            return nit.toJson (this.toPojo ());
        })
        .method ("write", function (res)
        {
            let body = this.toBody ();
            let cls = this.constructor;

            res.statusCode  = cls.STATUS;
            res.statusMessage = cls.MESSAGE;

            if (body instanceof Self.stream)
            {
                body.pipe (res);
            }
            else
            {
                res.end (nit.is.undef (body) ? "" : body);
            }
        })
    ;
};
