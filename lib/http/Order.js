module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("http.Order"))
        .meta ("unique", false)
        .use ("nit.utils.Tsort")
        .field ("<before>", "string", "The class should be ordered before.")
        .field ("<after>", "string", "The class should be ordered after.")

        .staticMethod ("getTargetName", function (hostClsNaname, targetName)
        {
            return hostClsNaname.split (".").slice (0, -targetName.split (".").length).concat (targetName).join (".");
        })
        .staticMethod ("applyOrders", function (objects)
        {
            let tsort = new Self.Tsort;
            let objectMap = {};

            objects.forEach (obj =>
            {
                let cn = obj.constructor.name.replace (/\$\d+$/, "");

                if (objectMap[cn])
                {
                    objectMap[cn].push (obj);
                }
                else
                {
                    objectMap[cn] = [obj];

                    tsort.addEdge (cn);

                    obj.constructor.getPlugins ("orders").forEach (o =>
                    {
                        tsort.addEdge (o.before, o.after);
                    });
                }
            });

            return nit.array (tsort.sort ().map (n => objectMap[n]), true).filter (nit.is.not.undef);
        })
        .onRegisteredBy (function (hostCls)
        {
            hostCls
                .staticMethod ("orderBefore", function (...afters)
                {
                    let name = this.name.replace (/\$\d+$/, "");

                    afters.forEach (after => this.order (new Self (name, Self.getTargetName (name, after))));

                    return this;
                })
                .staticMethod ("orderAfter", function (...befores)
                {
                    let name = this.name.replace (/\$\d+$/, "");

                    befores.forEach (before => this.order (new Self (Self.getTargetName (name, before), name)));

                    return this;
                })
            ;
        })
    ;
};
