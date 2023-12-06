module.exports = function (nit)
{
    return nit.definePlugin ("http.plugins.HandlerWorkflowAdapter")
        .require ("nit.Workflow")
        .field ("<workflow>", "workflow", "The workflow to be adapted")
        .onUsedBy (function (hostClass)
        {
            let workflowClass = nit.Workflow.lookup (this.workflow);

            hostClass
                .plugin ("http:handler-adapter")
                .buildRequest (nit.array (workflowClass.config ().options))
                .onRunTarget (async function (ctx)
                {
                    return (await workflowClass ().run ({ input: ctx.request.toPojo (), parent: ctx })).output;
                })
            ;
        })
    ;
};
