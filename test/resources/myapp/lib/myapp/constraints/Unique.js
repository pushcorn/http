module.exports = function (nit)
{
    return nit.defineConstraint ("myapp.constraints.Unique")
        .throws ("error.not_unique", "The valid '%{value}' is not unique.")
        // .onValidate ([> istanbul ignore next <] function (ctx)  // eslint-disable-line no-unused-vars
        // {
            // // will not be used
        // })
    ;
};
