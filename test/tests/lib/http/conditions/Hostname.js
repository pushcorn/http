const Context = nit.require ("http.Context");


test.method ("http.conditions.Hostname", "check")
    .should ("return %{result} when the name pattern is %{createArgs[0]|format} and hostname is %{args[0].req.hostname|format}")
        .init (function ()
        {
            this.createArgs = ["*"];
        })
        .given (Context.new ({ headers: { host: "pushcorn.com" } }))
        .returns (true)
        .commit ()

    .reset ()
        .init (function ()
        {
            this.createArgs = ["%.pushcorn.com"];
        })
        .given (Context.new ({ headers: { host: "pushcorn.com" } }))
        .returns (false)
        .commit ()

    .reset ()
        .init (function ()
        {
            this.createArgs = ["dev.%.pushcorn.com"];
        })
        .given (Context.new ({ headers: { host: "dev.site.pushcorn.com" } }))
        .returns (true)
        .commit ()

    .reset ()
        .init (function ()
        {
            this.createArgs = ["%.pushcorn.com"];
        })
        .given (Context.new ({ headers: { host: "a.pushcorn.com" } }))
        .returns (true)
        .commit ()

    .reset ()
        .init (function ()
        {
            this.createArgs = ["a.pushcorn.com"];
        })
        .given (Context.new ({ headers: { host: "a.pushcorn.com" } }))
        .returns (true)
        .commit ()

    .reset ()
        .init (function ()
        {
            this.createArgs = ["a.pushcorn.com"];
        })
        .given (Context.new ({ headers: { host: "b.pushcorn.com" } }))
        .returns (false)
        .commit ()

    .reset ()
        .init (function ()
        {
            this.createArgs = ["~(abc|def).pushcorn.com"];
        })
        .given (Context.new ({ headers: { host: "a.pushcorn.com" } }))
        .returns (true)
        .commit ()

    .reset ()
        .init (function ()
        {
            this.createArgs = ["~(abc|def).pushcorn.com"];
        })
        .given (Context.new ({ headers: { host: "abc.pushcorn.com" } }))
        .returns (false)
        .commit ()

    .reset ()
        .init (function ()
        {
            this.createArgs = ["(abc|def).pushcorn.com"];
        })
        .given (Context.new ({ headers: { host: "def.pushcorn.com" } }))
        .returns (true)
        .commit ()
;