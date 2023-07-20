module.exports = function (nit, http)
{
    return http.defineDescriptor ("Instance")
        .onBuild (function ()
        {
            let self = this;
            let runtimeClass = self.createRuntimeClass ();
            let instance = nit.new (runtimeClass, self.options);

            return instance;
        })
    ;
};
