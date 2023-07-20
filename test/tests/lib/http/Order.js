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
        .expectingPropertyToBeOfType ("result.2", "B")
        .expectingPropertyToBeOfType ("result.3", "D")
        .expectingPropertyToBeOfType ("result.4", "A")
        .expectingPropertyToBe ("result.0.tag", "c1")
        .expectingPropertyToBe ("result.1.tag", "c2")
        .commit ()
;


test.method ("http.Order", "onRegisterPlugin", true)
    .should ("add the static methods orderBefore and orderAfter to the host class")
        .given (nit.defineClass ("A", true))
        .after (function ()
        {
            this.args[0].registerPlugin ("http.Order");
        })
        .returns ()
        .expectingPropertyToBeOfType ("args.0.orderBefore", "function")
        .expectingPropertyToBeOfType ("args.0.orderAfter", "function")
        .expectingMethodToReturnValueOfType ("args.0.orderBefore", "B", "function")
        .expectingMethodToReturnValueOfType ("args.0.orderAfter", "C", "function")
        .expectingMethodToReturnValue ("args.0.orders.0.toPojo", null, { before: "A", after: "B" })
        .expectingMethodToReturnValue ("args.0.orders.1.toPojo", null, { before: "C", after: "A" })
        .commit ()
;
