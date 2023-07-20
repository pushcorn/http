module.exports = function (nit)
{
    return nit.defineConstraint ("myapp.constraints.Email")
        .throws ("error.invalid_email_format", "The email address '%{value}' is invalid.")
        .onValidate (function (ctx)
        {
            return ~ctx.value.indexOf ("@");
        })
    ;
};
