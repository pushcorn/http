module.exports = function (nit, http)
{
    return http.defineResponse ("http.responses.AccessUnauthorized")
        .info (401, "Unauthorized access.")
    ;
};
