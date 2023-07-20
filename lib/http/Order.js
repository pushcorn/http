module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.Order"))
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

                    obj.constructor.orders.forEach (o =>
                    {
                        tsort.addEdge (o.before, o.after);
                    });
                }
            });

            let nodes = tsort.nodes;

            for (let i = nodes.length - 1; i > 0; --i)
            {
                let cur = nodes[i];
                let isDep = false;

                for (let j = i - 1; j >= 0; --j)
                {
                    let prev = nodes[j];

                    if ((isDep = prev.dependencies.includes (cur.owner)))
                    {
                        break;
                    }
                }

                if (!isDep)
                {
                    cur.dependencies.push (nodes[i - 1].owner);
                }
            }

            return nit.array (tsort.sort ().map (n => objectMap[n]), true);
        })

        .staticMethod ("onRegisterPlugin", function (hostCls)
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
