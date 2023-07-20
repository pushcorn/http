const Context = nit.require ("http.Context");


test.method ("http.serviceplugins.FileServer", "resolve")
    .should ("return %{result} if the path is %{args.0}")
        .given ()
        .returns ()
        .commit ()

    .given ("resources/html/page-two.html")
        .returns ()
        .commit ()

    .given (nit.resolveAssetDir ("resources/html"))
        .init (s => s.createArgs = { indexes: "page-one.html" })
        .returns (nit.resolveAsset ("resources/html/page-one.html"))
        .commit ()

    .given (nit.resolveAssetDir ("resources/html"))
        .init (s => s.createArgs = { indexes: "page-three.html" })
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
        .init (s => s.createArgs = { indexes: "a.html" })
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
