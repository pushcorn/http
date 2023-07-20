module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponse ("http.responses.ValidationFailed"))
        .info (400, "One or more parameters are invalid.", "error.model_validation_failed")
        .defineInnerClass ("Violation", function (Violation)
        {
            Violation
                .field ("field", "string", "The field that failed the validation.")
                .field ("constraint", "string", "The constraint that caused error.")
                .field ("code", "string", "The error code.")
                .field ("message", "string", "The error message.")
            ;
        })
        .field ("<violations...>", Self.Violation.name, "The validation violations.")
    ;
};
