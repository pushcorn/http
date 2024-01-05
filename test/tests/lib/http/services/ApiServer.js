const Context = nit.require ("http.Context");


test.method ("http.services.ApiServer", "init")
    .should ("exclude the specified apis")
        .project ("myapp", true)
        .up (s =>
        {
            s.createArgs =
            {
                excludes: "myapp.apis.Hello",
                includes: ["myapp.*", "http.*"]
            };
        })
        .expectingPropertyToBe ("result.handlers.length", 4)
        .expectingPropertyToBe ("result.apis.length", 4)
        .commit ()

    .should ("include only the specified apis")
        .project ("myapp", true)
        .up (s =>
        {
            s.createArgs =
            {
                includes: "http.*"
            };
        })
        .expectingPropertyToBe ("result.handlers.length", 1)
        .commit ()
;


test.method ("http.services.ApiServer", "dispatch")
    .should ("return the API spec if the path is the API root")
        .project ("myapp", true)
        .up (s =>
        {
            s.createArgs =
            {
                mountPoint: "/api",
                includes: ["myapp.*", "http.*"]
            };
        })
        .given (Context.new ("GET", "/api"))
        .before (async (s) =>
        {
            await s.object.init ();
            await s.object.start ();
        })
        .expectingPropertyToBeOfType ("args.0.response", "http.responses.ApiSpecReturned")
        .expectingPropertyJsonToBe ("args.0.response", __filename)
        .commit ()

    .should ("dispatch the request to the target API")
        .project ("myapp", true)
        .up (s =>
        {
            s.createArgs =
            {
                mountPoint: "/api",
                includes: ["myapp.*", "http.*"]
            };
        })
        .before (async (s) =>
        {
            await s.object.init ();
            await s.object.start ();
        })
        .given (Context.new ("GET", "/api/hello?name=John&title=Mr."))
        .after (s => s.args[0].writeResponse ())
        .expectingPropertyToBeOfType ("args.0.response", "myapp.responses.HelloMessageReturned")
        .expectingPropertyToBe ("args.0.responseBody", `{"message":"Hello Mr. John!"}`)
        .expectingPropertyToBe ("args.0.status", 200)
        .expectingPropertyToBe ("args.0.res.statusMessage", "The hello message has been returned.")
        .expectingPropertyToBe ("args.0.responseHeaders.X-Response-Name", "myapp.responses.HelloMessageReturned")
        .commit ()

    .reset ()
        .project ("myapp", true)
        .up (s =>
        {
            s.createArgs =
            {
                mountPoint: "/api",
                includes: ["myapp.*", "http.*"]
            };
        })
        .before (async (s) =>
        {
            await s.object.init ();
            await s.object.start ();
        })
        .given (Context.new ("GET", "/api/hello2?name=Jane"))
        .expectingPropertyToBe ("args.0.responseHeaders.X-Response-Name", undefined)
        .commit ()
;
