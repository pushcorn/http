module.exports = function (nit, http, Self)
{
    return (Self = http.defineService ("http.HandlerService"))
        .k ("handlerClass")
        .m ("error.not_handler_subclass", "The class %{class}' is not a subclass of http.Handler.")
        .staticMethod ("forHandler", function (cls)
        {
            let handlerClass = nit.lookupClass (cls);

            if (!nit.is.subclassOf (handlerClass, http.Handler))
            {
                this.throw ("error.not_handler_subclass", { class: cls });
            }

            this[Self.kHandlerClass] = handlerClass;

            return this;
        })
        .field ("includes...", "string", "The name patterns of the handlers to be included.")
        .field ("excludes...", "string", "The name patterns of the handlerss to be excluded.")

        .memo ("includePatterns", function ()
        {
            return this.includes.map (nit.glob.parse);
        })
        .memo ("excludePatterns", function ()
        {
            return this.excludes.map (nit.glob.parse);
        })
        .configureComponentMethod ("init", Method =>
        {
            Method.before ("loadHandlers", function (self)
            {
                let { includePatterns, excludePatterns } = self;
                let handlerClass = self.constructor[Self.kHandlerClass];
                let category = nit.categoryName (handlerClass);

                self.handlers.push (...nit.lookupComponents (category, handlerClass.name)
                    .filter (c => (!includePatterns.length || includePatterns.some (p => nit.glob (c.name, p)))
                        && (!excludePatterns.length || !excludePatterns.some (p => nit.glob (c.name, p)))
                    )
                    .map (c => c.name)
                );
            });
        })
    ;
};
