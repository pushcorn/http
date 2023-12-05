test.plugin ("http.ResponseFilter", "filterResponse", { instancePluginAllowed: true, registerPlugin: true })
    .should ("filter the response")
        .up (s => s.http.defineResponseFilter ("test.responsefilters.MyFilter")
            .condition ("http:request-content-type", "application/json")
            .onApply (ctx =>
            {
                ctx.response = { "@name": "http:json", json: { a: 3 } };
                s.applied = true;
            })
        )
        .up (s => s.http.defineResponseFilter ("test.responsefilters.AddHeader")
            .condition ("http:request-content-type", "application/json")
            .onApply (ctx =>
            {
                ctx.responseHeader ("my-header", "yes");
            })
        )
        .up (s => s.hostArgs = { responsefilters: ["test:my-filter", "test:add-header"] })
        .up (s => s.args = s.Context.new ({ headers: { "content-type": "application/json" } }, { status: 200 }))
        .expectingPropertyToBe ("applied", true)
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Length", 7)
        .expectingPropertyToBe ("args.0.responseHeaders.my-header", "yes")
        .commit ()

    .should ("skip the filters no applicable to the context")
        .up (s => s.applied = false)
        .up (s => s.http.defineResponseFilter ("test.responsefilters.MyFilter")
            .condition ("http:request-content-type", "application/xml")
            .onApply (() => s.applied = true)
        )
        .up (s => s.hostArgs = { responsefilters: "test:my-filter" })
        .up (s => s.args = s.Context.new ({ headers: { "content-type": "application/json" } }, { status: 200 }))
        .expectingPropertyToBe ("applied", false)
        .commit ()
;


test.method ("http.ResponseFilter", "readBodyAsString", true)
    .should ("parse the response buffer into a string")
        .given ({ responseBody: Buffer.from ("test") })
        .returns ("test")
        .commit ()

    .should ("parse the response stream into a string")
        .up (s => s.args = { responseBody: s.bufferToStream ("test") })
        .returns ("test")
        .commit ()

    .should ("parse the response data into a string")
        .given ({ responseBody: 1 })
        .returns ("1")
        .commit ()
;
