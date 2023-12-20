module.exports = function (nit, http, Self)
{
    return (Self = nit.requireAsset ("public/lib/http/Request"))
        .defineValidationContext (ValidationContext =>
        {
            ValidationContext
                .field ("requestContext", "nit.Context")
            ;
        })
    ;
};
