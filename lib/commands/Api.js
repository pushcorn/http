module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Api"))
        .describe ("Run an API.")
        .use ("nit.utils.Colorizer")
        .use ("http.utils.ApiInvoker")
        .defineSubcommand (Subcommand =>
        {
            Subcommand
                .onBuildSubcommand ((Subcommand, Api) =>
                {
                    Subcommand
                        .describe (Api.description)
                        .defineInput (Input =>
                        {
                            Input
                                .importProperties (Api.Request.parameters, nit.COMPLETION_MODE ? "" : "constraints")
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
        })
        .defineInput (Input =>
        {
            Input
                .option ("<api>", Self.Subcommand.name, "The API to be invoked.")
                .option ("url", "string", "The API's base URL.", "http://127.0.0.1")
                .option ("port", "integer?", "The server port.")
                .option ("silent", "boolean", "Suppress the response status info.")
                .option ("insecure", "boolean", "Whether to reject connections with unverified certs.")
                .option ("host", "string", "The host name to use.")
            ;
        })
        .onRun (({ input }) =>
        {
            let api = input.api;
            let invoker = new Self.ApiInvoker (api.component, { parameters: api.input.toPojo () }, nit.omit (input.toPojo (), "api"));

            return invoker.invoke ();
        })
    ;
};
