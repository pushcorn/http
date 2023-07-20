const Context = nit.require ("http.Context");


test.method ("http.responsefilters.CssCompiler", "applicableTo")
    .should ("return %{result} if (ctx.responseHeaders.Content-Type, class.Compiler) = (%{args[0].responseHeaders['Content-Type']|format}, %{class.Compiler})")
        .given (Context.new ())
        .returns (false)
        .commit ()

    .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseHeader ("Content-Type", "text/css");
        }))
        .returns (true)
        .commit ()

    .should ("return %{result} if (ctx.responseHeaders.Content-Type, class.Compiler) = (%{args[0].responseHeaders['Content-Type']|format}, <undefined>)")
        .given (nit.do (Context.new (), ctx =>
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


test.method ("http.responsefilters.CssCompiler", "apply")
    .should ("compile the CSS content")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseBody = Buffer.from ("a { color: red }");
        }))
        .expectingPropertyToBe ("args.0.responseBody", nit.trim.text`
        a {
            color: red;
        }`)
        .commit ()
;
