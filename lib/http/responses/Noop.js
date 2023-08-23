module.exports = function (nit, http)
{
    return http.defineResponse ("http.responses.Noop")
        .info (0, "OK")
    ;
};
