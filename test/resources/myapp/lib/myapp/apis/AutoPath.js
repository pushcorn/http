module.exports = function (nit, http)
{
    return http.defineApi ("myapp.apis.AutoPath")
        .onDispatch (/* istanbul ignore next */ function () {})
    ;
};
