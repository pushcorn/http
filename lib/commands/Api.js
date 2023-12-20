module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Api"))
        .describe ("Run an API.")
        .require ("nit.Task")
        .use ("nit.utils.Colorizer")
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
                                    cls.fields.forEach (f => f.positional || (f.required = false));

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
        .onRun (async ({ input }) =>
        {
            let api = input.api;
            let response = await nit.runTask ("http:invoke-api", api.component, { parameters: api.input.toPojo () }, nit.omit (input.toPojo (), "api"));
            let { statusCode, statusMessage, headers, body, isText, isJson } = response;
            let { bold, inverse, green, red, gray } = Self.Colorizer.Auto;
            let ok = ~~(statusCode / 100) == 2;
            let color = ok ? green : red;
            let tty = process.stdout.isTTY;

            if (!input.silent)
            {
                let statusOut = (tty || !ok) ? process.stderr : process.stdout;
                let output = [];

                output.push (bold (inverse (color (tty ? ` ${statusCode} ` : statusCode))) + " " + bold (nit.trim (statusMessage)) + "\n");

                nit.each (headers, function (v, k)
                {
                    output.push (bold (k.split ("-").map (nit.pascalCase).join ("-") + ": " + v));
                });

                statusOut.write (output.join ("\n") + "\n\n");
            }

            process.exitCode = Math.max (0, !ok);

            if (isText)
            {
                return gray (isJson ? nit.toJson (body, "  ") : body);
            }
            else
            {
                return body;
            }
        })
    ;
};
