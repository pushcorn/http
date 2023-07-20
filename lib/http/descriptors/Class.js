module.exports = function (nit, http)
{
    return http.defineDescriptor ("Class")
        .onBuild (function ()
        {
            return this.createRuntimeClass ();
        })
    ;
};
