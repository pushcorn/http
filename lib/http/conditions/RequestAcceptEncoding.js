module.exports = function (nit, http)
{
    return http.defineCondition ("RequestAcceptEncoding")
        .field ("<encodings...>", "string", "The encodings that the client accepts.")
            .constraint ("choice", "gzip", "deflate", "br")

        .method ("check", function (ctx)
        {
            let encoding = ctx.acceptsEncoding (...this.encodings);

            if (encoding)
            {
                ctx.responseEncoding = encoding;

                return true;
            }

            return false;
        })
    ;
};
