module.exports = function (nit, http)
{
    return http.defineResponse ("http.responses.ResourceNotFound")
        .info (400, "The resource was not found.")
    ;
};
