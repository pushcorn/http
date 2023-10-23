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
                        .staticMethod ("parseArgv", function ()
                        {
                            let cls = this;

                            // make fields optional and let the server handle the validation
                            cls.fields.forEach (f => f.required = false);

                            return Input.superclass.parseArgv.apply (cls, arguments);
                        })
                    ;
                })
            ;
        })
    ;
};
