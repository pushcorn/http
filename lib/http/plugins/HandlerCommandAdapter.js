module.exports = function (nit)
{
    return nit.definePlugin ("http.plugins.HandlerCommandAdapter")
        .require ("nit.Command")
        .field ("<command>", "command", "The command to be adapted")
        .onUsedBy (function (hostClass)
        {
            let commandClass = nit.lookupCommand (this.command);
            let scOpt = commandClass.Input.subcommandOption;

            hostClass
                .plugin ("http:handler-adapter")
                .buildRequest (commandClass.Input.options, Request =>
                {
                    Request
                        .do (!!scOpt, () =>
                        {
                            Request.parameter ("subcommandOptions...", "any", "The subcommand options.");
                        })
                        .parameters
                        .forEach (p =>
                        {
                            if (p.name == scOpt?.name)
                            {
                                p.type = "string";
                                p.parser = Request.findTypeParser ("string");
                                p.primitive = true;
                            }
                        })
                    ;
                })
                .onRunTarget (async function (ctx)
                {
                    let input = ctx.request.toPojo ();
                    let subcommand;

                    if (scOpt && (subcommand = input[scOpt.name]))
                    {
                        let subcommandClass = scOpt.class.lookup (subcommand);

                        input[scOpt.name] = new subcommandClass ({ input: nit.parseKvp (input.subcommandOptions) });
                    }

                    delete input.subcommandOptions;

                    let context = await new commandClass.Context (commandClass.Input.fromArgv (input));

                    context.parent = ctx;

                    return (await commandClass ().run (context)).output;
                })
            ;
        })
    ;
};
