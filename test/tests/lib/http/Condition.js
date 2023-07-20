test.method ("http.Condition", "onRegisterPlugin", true)
    .should ("add the applicableTo method to the host class")
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
            this.isFilterApplicable = this.filter.applicableTo (nit.require ("http.Context").new ("GET", "/users"));
        })
        .expectingPropertyToBeOfType ("args.0.prototype.applicableTo", "function")
        .expectingPropertyToBe ("isFilterApplicable", true)
        .expectingPropertyToBeOfType ("checkCtx", "http.Context")
        .expectingPropertyToBeOfType ("checkOwner", "Filter")
        .commit ()

    .should ("only check the first condition of every type")
        .given (nit.defineClass ("MyApi", "http.Api"))
        .after (s =>
        {
            const MyApi = s.args[0];

            MyApi.condition ("http:request-path", "/api1");

            const ChildApi = MyApi.defineSubclass ("ChildApi");

            ChildApi.condition ("http:request-path", "/child-api");

            s.applicableToChildApiPath = ChildApi ().applicableTo (s.Context.new ("GET", "/child-api"));
            s.applicableToMyApiPath = ChildApi ().applicableTo (s.Context.new ("GET", "/api1"));
        })
        .expectingPropertyToBe ("applicableToChildApiPath", true)
        .expectingPropertyToBe ("applicableToMyApiPath", false)
        .commit ()
;
