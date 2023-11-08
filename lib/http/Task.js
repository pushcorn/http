module.exports = function (nit)
{
    return nit.defineClass ("http.Task", "nit.Task")
        .categorize ("http.tasks")
    ;
};
