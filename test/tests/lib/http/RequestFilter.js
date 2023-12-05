test.plugin ("http.RequestFilter", "filterRequest", { instancePluginAllowed: true, registerPlugin: true })
    .should ("filter the request")
        .up (s => s.hostArgs = { requestfilters: "http:json-body-parser" })
        .up (s => s.args = s.Context.new ({ headers: { "content-type": "application/json" } }))
        .mock ("http.requestfilters.JsonBodyParser.prototype", "apply")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .commit ()

    .should ("skip the filters no applicable to the context")
        .up (s => s.hostArgs = { requestfilters: "http:json-body-parser" })
        .up (s => s.args = s.Context.new ())
        .commit ()
;


test.method ("http.RequestFilter", "parseStream", true)
    .should ("parse the stream with the given encoding")
        .up (s => s.args = s.bufferToStream ("test"))
        .returns (Buffer.from ("test"))
        .commit ()

    .up (s => s.args = [s.bufferToStream ("test"), "utf8"])
        .returns ("test")
        .commit ()

    .should ("throw the status code if the erro has the status property")
        .up (s => s.args = [s.bufferToStream ("test"), "unsupported"])
        .throws (415)
        .commit ()

    .should ("throw if the parsing failed")
        .up (s => s.args = [s.bufferToStream ("test"), "unsupported"])
        .mock (require ("bytes"), "parse", function ()
        {
            throw new Error ("ERR!");
        })
        .throws (/ERR!/)
        .commit ()
;


test.method ("http.RequestFilter", "readBodyAsBuffer", true)
    .should ("read the request stream as a buffer")
    .up (s => s.args = { requestStream: s.bufferToStream ("test") })
    .returns (Buffer.from ("test"))
    .commit ()
;


test.method ("http.RequestFilter", "readBodyAsString", true)
    .should ("read the request stream as a string")
    .up (s => s.args = { requestStream: s.bufferToStream ("test") })
        .returns ("test")
        .commit ()

    .up (s => s.args = [{ requestStream: s.bufferToStream ("test") }, "base64"])
        .returns ("dGVzdA==")
        .commit ()
;
