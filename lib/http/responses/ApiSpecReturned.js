module.exports = function (nit, http)
{
    return http.defineResponse ("ApiSpecReturned")
        .info (200, "The API spec has been returned.")
        .field ("<spec>", "http.ApiSpec")
    ;
};
