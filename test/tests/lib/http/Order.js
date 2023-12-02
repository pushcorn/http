test.method ("http.Order", "getTargetName", true)
    .should ("return %{result|format} when the host class name is %{args.0|format} and the target class name is %{args.1|format}")
        .given ("http.response.filters.BodyCompressor", "CacheController")
        .returns ("http.response.filters.CacheController")
        .commit ()

    .given ("http.response.filters.BodyCompressor", "a.b.c.CacheController")
        .returns ("a.b.c.CacheController")
        .commit ()

    .given ("http.response.filters.BodyCompressor", "c.CacheController")
        .returns ("http.response.c.CacheController")
        .commit ()
;


test.method ("http.Order", "applyOrders", true)
    .should ("sort the objects based on the defined orders")
        .up (function ()
        {
            const A = nit.defineClass ("A")
                .registerPlugin ("http.Order")
                .orderAfter ("B")
            ;

            const B = nit.defineClass ("B")
                .registerPlugin ("http.Order")
                .orderAfter ("C")
            ;

            const C = nit.defineClass ("C")
                .registerPlugin ("http.Order")
                .field ("<tag>", "string")
            ;

            const D = nit.defineClass ("D")
                .registerPlugin ("http.Order")
            ;

            this.args.push ([new A, new B, new C ("c1"), new D, new C ("c2")]);
        })
        .returnsInstanceOf (Array)
        .expectingPropertyToBeOfType ("result.0", "C")
        .expectingPropertyToBeOfType ("result.1", "C")
        .expectingPropertyToBeOfType ("result.2", "D")
        .expectingPropertyToBeOfType ("result.3", "B")
        .expectingPropertyToBeOfType ("result.4", "A")
        .expectingPropertyToBe ("result.0.tag", "c1")
        .expectingPropertyToBe ("result.1.tag", "c2")
        .commit ()

    .should ("sort the objects based on the given order if orderBefore and orderAfter are not used")
        .up (function ()
        {
            const A = nit.defineClass ("A")
                .registerPlugin ("http.Order")
            ;

            const B = nit.defineClass ("B")
                .registerPlugin ("http.Order")
            ;

            const C = nit.defineClass ("C")
                .registerPlugin ("http.Order")
                .field ("<tag>", "string")
            ;

            const D = nit.defineClass ("D")
                .registerPlugin ("http.Order")
            ;

            this.args.push ([new A, new B, new C ("c1"), new D, new C ("c2")]);
        })
        .returnsInstanceOf (Array)
        .expectingPropertyToBeOfType ("result.0", "A")
        .expectingPropertyToBeOfType ("result.1", "B")
        .expectingPropertyToBeOfType ("result.2", "C")
        .expectingPropertyToBeOfType ("result.3", "C")
        .expectingPropertyToBeOfType ("result.4", "D")
        .commit ()
;


test.plugin ("http.Order", "orderBefore", true, { registerPlugin: true, pluginArgs: ["B", "A"] })
    .should ("add the specified orders")
        .given ("B")
        .before (s => s.hostClass.id = "jo")
        .after (s => s.hostClass.orderAfter ("C"))
        .returnsProperty ("hostClass")
        .expectingPropertyToBe ("hostClass.orders.length", 2)
        .expectingPropertyToBe ("hostClass.orders.0.before", "test.PluginHost")
        .expectingPropertyToBe ("hostClass.orders.1.before", "test.C")
        .commit ()
;
