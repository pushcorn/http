module.exports = function (nit, http)
{
    return http.defineApi ("myapp.apis.AutoPath")
        .onRun (/* istanbul ignore next */ function () {})
    ;
};
