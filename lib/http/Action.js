module.exports = function (nit, http)
{
    return http.defineHandler ("http.Action")
        .categorize ("http.actions")
        .defineDescriptor ()
    ;
};
