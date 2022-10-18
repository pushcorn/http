test.method ("http.Condition", "onRegisterPlugin", true)
    .should ("add the appliesTo method to the host class")
        .given (nit.defineClass ("Filter", true))
        .after (function ()
        {
            const TestCond = nit.defineClass ("TestCond", "http.Condition")
                .method ("check", (ctx, owner) =>
                {
                    this.checkCtx = ctx;
                    this.checkOwner = owner;

                    return true;
                })
            ;

            const Filter = this.args[0];

            Filter.registerPlugin (this.class);
            Filter.condition (new TestCond);

            this.filter = new Filter;
            this.isFilterApplicable = this.filter.appliesTo (nit.require ("http.Context").create ("GET", "/users"));
        })
        .expectingPropertyToBeOfType ("args.0.prototype.appliesTo", "function")
        .expectingPropertyToBe ("isFilterApplicable", true)
        .expectingPropertyToBeOfType ("checkCtx", "http.Context")
        .expectingPropertyToBeOfType ("checkOwner", "Filter")
        .commit ()
;
