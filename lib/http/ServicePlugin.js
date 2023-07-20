module.exports = function (nit)
{
    return nit.defineClass ("http.ServicePlugin")
        .categorize ("http.serviceplugins")
        .mixin ("http:describable")
        .defineInstanceDescriptor ()
        .lifecycleMethod ("preInit", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postInit", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preStart", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postStart", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preStop", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postStop", null, /* istanbul ignore next */ function (service) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preUpgrade", null, /* istanbul ignore next */ function (service, req, socket, head) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postUpgrade", null, /* istanbul ignore next */ function (service, req, socket, head) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preDispatch", null, /* istanbul ignore next */ function (service, ctx) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postDispatch", null, /* istanbul ignore next */ function (service, ctx) {}) // eslint-disable-line no-unused-vars
    ;
};
