module.exports = function (nit, http)
{
    return http.defineResponse ("myapp.responses.CheckInRecorded")
        .info (201, "The check-in info has been recorded.")
    ;
};
