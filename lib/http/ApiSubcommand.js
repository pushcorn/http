module.exports = function (nit)
{
    return nit.defineClass ("http.ApiSubcommand", "nit.Subcommand")
        .forComponent ("http.Api")
        .onBuildSubcommand ((Subcommand, Api) =>
        {
            Subcommand
                .describe (Api.description)
                .defineInput (Input =>
                {
                    Input
                        .import (Api.Request.parameters, nit.COMPLETION_MODE ? "" : "constraints")
                        .do ("fields", fields =>
                        {
                            fields.forEach (f => f.required = false);
                        })
                    ;
                })
            ;
        })
    ;
};
