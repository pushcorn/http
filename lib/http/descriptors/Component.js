module.exports = function (nit)
{
    return nit.defineClass ("http.descriptors.Component")
        .field ("<name>", "string", "The plugin name.")
        .field ("[options]", "any", "The plugin options.")
    ;
};
