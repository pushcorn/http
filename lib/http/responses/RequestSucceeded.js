module.exports = function (nit, http)
{
    return http.defineResponse ("http.responses.RequestSucceeded")
        .info (200, "The request has been fulfilled.")
        .field ("data", "any", "The response data.")
    ;
};
