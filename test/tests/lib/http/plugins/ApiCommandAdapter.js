test.plugin ("http:api-command-adapter", "run")
    .should ("run the adapated command")
        .project ("project-a", true, true)
        .init (s => s.hostClass = s.http.defineApi ("MyApi"))
        .init (s => s.hostClassName = "")
        .init (s => s.pluginArgs = "git")
        .givenContext ({ data: { gitcommand: "push" } })
        .expectingPropertyToBeOfType ("result.response", "http.responses.Json")
        .expectingPropertyToBe ("result.response.json", { repo: "", all: false })
        .commit ()
;


test.method ("http.plugins.ApiCommandAdapter", "usedBy")
    .should ("add the subcommand completer to the host class if needed")
        .project ("project-a", true, true)
        .up (s => s.createArgs = "git")
        .up (s => s.hostClass = s.http.defineApi ("MyApi"))
        .up (s => s.args = s.hostClass)
        .after (s => s.Completer = nit.lookupClass (s.hostClass.name + ".compgencompleters.Completer"))
        .after (s => s.completions1 = s.Completer.generate (
        {
            completionType: "option",
            filterCompletions: v => v,
            commandClass:
            {
                name: "commands.Api"
            }
            ,
            currentOption:
            {
                name: "subcommandOptions"
            }
            ,
            specifiedValues:
            {
                api: "http:my-api",
                gitcommand: "push"
            }
        }))
        .after (s => s.completions2 = s.Completer.generate (
        {
            completionType: "option",
            filterCompletions: v => v,
            commandClass:
            {
                name: "commands.Api"
            }
            ,
            currentOption:
            {
                name: "subcommandOptions"
            }
            ,
            specifiedValues:
            {
                api: "http:my-api"
            }
        }))
        .after (s => s.completions3 = s.Completer.generate (
        {
            completionType: "option",
            filterCompletions: v => v,
            commandClass:
            {
                name: "commands.Api"
            }
            ,
            currentOption:
            {
                name: "gitcommand"
            }
            ,
            specifiedValues:
            {
                api: "http:my-api"
            }
        }))
        .expectingPropertyToBe ("completions1", ["VALUE", "repo=", "logLevel=", "all="])
        .expectingPropertyToBe ("completions2")
        .expectingPropertyToBe ("completions3", ["VALUE", "pull", "push"])
        .commit ()
;
