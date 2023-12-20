module.exports = function (nit)
{
    return nit.requireAsset ("public/lib/http/Request")
        .defineValidationContext (ValidationContext =>
        {
            ValidationContext
                .field ("requestContext", "nit.Context")
            ;
        })
    ;
};
