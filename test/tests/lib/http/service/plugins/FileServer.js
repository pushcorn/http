const Context = nit.require ("http.Context");


test.method ("http.service.plugins.FileServer", "resolve")
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


test.method ("http.service.plugins.FileServer", "postDispatch")
    .should ("set the response to FileReturned if the response was not set and the index file exists")
        .given (null, Context.create ())
        .expectingPropertyToBeOfType ("args.1.response", "http.responses.FileReturned")
        .expectingPropertyToBe ("args.1.response.path", nit.resolveAsset ("public/index.html"))
        .commit ()

    .should ("skip if the index file does not exist")
        .init (s => s.createArgs = { indexes: "a.html" })
        .given (null, Context.create ())
        .expectingPropertyToBe ("args.1.response")
        .commit ()

    .should ("skip if the response was set")
        .given (null, nit.do (Context.create (), ctx =>
        {
            ctx.response = nit.new ("http.responses.Noop");
        }))
        .expectingPropertyToBeOfType ("args.1.response", "http.responses.Noop")
        .commit ()
;
