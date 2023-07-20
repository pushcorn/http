module.exports = function (nit, http, Self)
{
    return (Self = http.defineService ("ApiServer"))
        .use ("http.Api")
        .field ("includes...", "string", "The name patterns of the APIs to be included.")
        .field ("excludes...", "string", "The name patterns of the APIs to be excluded.")

        .memo ("includePatterns", function ()
        {
            return this.includes.map (nit.glob.parse);
        })
        .memo ("excludePatterns", function ()
        {
            return this.excludes.map (nit.glob.parse);
        })

        .onInit (function ()
        {
            let { includePatterns, excludePatterns } = this;

            this.apis.push (...nit.lookupComponents ("apis", "http.Api")
                .filter (c => (!includePatterns.length || includePatterns.some (p => nit.glob (c.name, p)))
                    && (!excludePatterns.length || !excludePatterns.some (p => nit.glob (c.name, p)))
                )
                .map (c =>
                {
                    let cls = Self.Api.Descriptor.defineRuntimeClass (c);

                    return new cls;
                })
            );
        })
    ;
};
