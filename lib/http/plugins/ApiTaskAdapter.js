module.exports = function (nit)
{
    return nit.definePlugin ("http.plugins.ApiTaskAdapter")
        .require ("nit.Task")
        .field ("<task>", "task", "The task to be adapted")
        .onUsedBy (function (hostClass)
        {
            let { task } = this;
            let taskClass = nit.lookupComponent (task, "tasks");

            hostClass
                .plugin ("http:handler-task-adapter", task)
                .plugin ("http:api-adapter")
                .info (taskClass.description)
            ;
        })
    ;
};

