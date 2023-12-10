module.exports = function (nit)
{
    return nit.defineClass ("http")
        .constant ("METHODS_WITHOUT_REQUEST_BODY", ["GET", "DELETE", "HEAD"])
    ;
};
