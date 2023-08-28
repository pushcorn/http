const Context = nit.require ("http.Context");


test.method ("http.serviceplugins.FileServer", "resolve")
    .should ("return %{result} if the path is %{args.0}")
        .given ()
        .returns (nit.path.join (nit.PATH_ALIASES["@pushcorn/http"], "public/index.html"))
        .commit ()

    .given ("resources/html/page-two.html")
        .returns ()
        .commit ()

    .up (s => s.createArgs =
        {
            roots: nit.resolveAssetDir ("resources/html"),
            indexes: "page-one.html"
        })
        .given ()
        .returns (nit.resolveAsset ("resources/html/page-one.html"))
        .commit ()

    .up (s => s.createArgs =
        {
            roots: nit.resolveAssetDir ("resources/html"),
            indexes: "page-three.html"
        })
        .given ()
        .returns ()
        .commit ()
;


test.method ("http.serviceplugins.FileServer", "postDispatch")
    .should ("set the response to FileReturned if the response was not set and the index file exists")
        .given (null, Context.new ())
        .expectingPropertyToBeOfType ("args.1.response", "http.responses.FileReturned")
        .expectingPropertyToBe ("args.1.response.path", nit.resolveAsset ("public/index.html"))
        .commit ()

    .should ("skip if the index file does not exist")
        .up (s => s.createArgs = { indexes: "a.html" })
        .given (null, Context.new ())
        .expectingPropertyToBe ("args.1.response")
        .commit ()

    .should ("skip if the response was set")
        .given (null, nit.do (Context.new (), ctx =>
        {
            ctx.response = nit.new ("http.responses.Noop");
        }))
        .expectingPropertyToBeOfType ("args.1.response", "http.responses.Noop")
        .commit ()
;
