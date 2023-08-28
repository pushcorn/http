const Context = nit.require ("http.Context");


test.method ("http.conditions.FileExtension", "check")
    .should ("return %{result} when the extension is .jpg and path is %{args[0].path|format}")
        .up (function ()
        {
            this.createArgs = ".jpg";
        })
        .given (Context.new ("GET", "/images/a.jpg"))
        .returns (true)
        .commit ()

    .should ("return %{result} when the extension is jpg and path is %{args[0].path|format}")
        .up (function ()
        {
            this.createArgs = ["jpg", "png"];
        })
        .given (Context.new ("GET", "/images/a.jpg"))
        .returns (true)
        .commit ()

    .should ("return %{result} when the extension is jpg and path is %{args[0].path|format}")
        .up (function ()
        {
            this.createArgs = "jpg";
        })
        .given (Context.new ("GET", "/images/a.png"))
        .returns (false)
        .commit ()
;
