module.exports = function (nit)
{
    return nit.defineCommand ("myapp.commands.Server")
        .commandplugin ("http:server",
        {
            name: "myapp server"
        })
    ;
};
