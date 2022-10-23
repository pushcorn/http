module.exports = function (nit)
{
    return nit.defineClass ("http.service.Plugin")
        .categorize ("http.service.plugins")
        .method ("onInit", /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
        .method ("onStart", /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
        .method ("onStop", /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
        .method ("onUpgrade", /* istanbul ignore next */ function (service, req, socket, head) {}) // eslint-disable-line no-unused-vars
        .method ("preDispatch", /* istanbul ignore next */ function (service, ctx) {}) // eslint-disable-line no-unused-vars
        .method ("postDispatch", /* istanbul ignore next */ function (service, ctx) {}) // eslint-disable-line no-unused-vars
    ;
};
