module.exports = function (nit)
{
    return nit.definePlugin ("http.plugins.HandlerTaskAdapter")
        .require ("nit.Task")
        .field ("<task>", "task", "The task to be adapted")
        .onUsedBy (function (hostClass)
        {
            let taskClass = nit.lookupComponent (this.task, "tasks");

            hostClass
                .plugin ("http:handler-adapter")
                .buildRequest (taskClass.fields)
                .onRunTarget (async function (ctx)
                {
                    let task = new taskClass (ctx.request.toPojo ());

                    return (await task.run ({ parent: ctx })).result;
                })
            ;
        })
    ;
};
