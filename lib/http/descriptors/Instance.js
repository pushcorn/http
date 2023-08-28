module.exports = function (nit, http)
{
    return http.defineDescriptor ("Instance")
        .defineMeta ("fieldsAsOptions", "boolean")
        .onBuild (function ()
        {
            let self = this;

            if (self.constructor.fieldsAsOptions)
            {
                self.options = self.toPojo ();
            }

            let runtimeClass = self.createRuntimeClass ();
            let instance = nit.new (runtimeClass, self.options);

            return instance;
        })
    ;
};
