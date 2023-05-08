module.exports = function (nit)
{
    return nit.defineClass ("http.Conditional")
        .categorize ()
        .registerPlugin ("http.Condition")
    ;
};
