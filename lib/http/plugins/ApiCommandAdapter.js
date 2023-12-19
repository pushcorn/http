module.exports = function (nit)
{
    return nit.definePlugin ("http.plugins.ApiCommandAdapter")
        .require ("nit.Command")
        .field ("<command>", "command", "The command to be adapted")
        .onUsedBy (function (hostClass)
        {
            let { command } = this;
            let commandClass = nit.lookupCommand (command);
            let scOpt = commandClass.Input.subcommandOption;

            hostClass
                .plugin ("http:handler-command-adapter", command)
                .plugin ("http:api-adapter")
                .do (!!scOpt, () =>
                {
                    hostClass
                        .plugin ("compgen-completer")
                        .defineCompgenCompleter (Completer =>
                        {
                            Completer
                                .completeForOption ("commands.Api.subcommandOptions", { api: nit.ComponentDescriptor.normalizeName (hostClass.name, "apis") }, ctx =>
                                {
                                    let subcommand;

                                    if ((subcommand = ctx.specifiedValues[scOpt.name]))
                                    {
                                        let subcommandClass = scOpt.class.lookup (subcommand);

                                        return [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (subcommandClass.Input.enumerablePropertyNames.map (n => n + "="))];
                                    }
                                })
                                .completeForOption ("commands.Api." + scOpt.name, { api: nit.ComponentDescriptor.normalizeName (hostClass.name, "apis") }, ctx =>
                                {
                                    let comps = scOpt.class.listBackingComponents ().map (d => d.name);

                                    return [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (comps)];
                                })
                            ;
                        })
                    ;
                })
                .describe (commandClass.description)
            ;
        })
    ;
};

