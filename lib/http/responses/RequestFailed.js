module.exports = function (nit, http)
{
    return http.defineResponse ("http.responses.RequestFailed")
        .info (500, "Sorry, we are unable to process your request right now. Please try again later.")
        .field ("code", "string", "The error code.")
        .field ("data", "any", "The response data.")
    ;
};
