const Context = nit.require ("http.Context");


test.method ("http.response.filters.CssCompiler", "appliesTo")
    .should ("return %{result} if (ctx.responseHeaders.Content-Type, class.Compiler) = (%{args[0].responseHeaders['Content-Type']|format}, %{class.Compiler})")
        .given (Context.create ())
        .returns (false)
        .commit ()

    .given (nit.do (Context.create (), ctx =>
        {
            ctx.responseHeader ("Content-Type", "text/css");
        }))
        .returns (true)
        .commit ()

    .should ("return %{result} if (ctx.responseHeaders.Content-Type, class.Compiler) = (%{args[0].responseHeaders['Content-Type']|format}, <undefined>)")
        .given (nit.do (Context.create (), ctx =>
        {
            ctx.responseHeader ("Content-Type", "text/css");
        }))
        .before (function ()
        {
            this.Compiler = this.class.Compiler;
            nit.dpv (this.class, "Compiler", undefined, true);
        })
        .after (function ()
        {
            nit.dpv (this.class, "Compiler", this.Compiler, true);
        })
        .returns (false)
        .commit ()
;


test.method ("http.response.filters.CssCompiler", "apply")
    .should ("compile the CSS content")
        .given (nit.do (Context.create (), ctx =>
        {
            ctx.responseBody = Buffer.from ("a { color: red }");
        }))
        .expectingPropertyToBe ("args.0.responseBody", nit.trim.text`
        a {
            color: red;
        }`)
        .commit ()
;
