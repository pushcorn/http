module.exports = function (nit)
{
    return nit.definePlugin ("http.plugins.ApiWorkflowAdapter")
        .require ("nit.Workflow")
        .field ("<workflow>", "workflow", "The workflow to be adapted")
        .onUsedBy (function (hostClass)
        {
            let { workflow } = this;
            let workflowClass = nit.Workflow.lookup (workflow);

            hostClass
                .plugin ("http:handler-workflow-adapter", workflow)
                .plugin ("http:api-adapter")
                .info (workflowClass ().description)
            ;
        })
    ;
};

