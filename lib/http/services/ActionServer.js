module.exports = function (nit, http)
{
    return http.defineService ("ActionServer", "http.HandlerService")
        .forHandler ("http.Action")
    ;
};
