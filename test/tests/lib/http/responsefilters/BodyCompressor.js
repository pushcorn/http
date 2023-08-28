const { Readable } = require ("stream");
const Context = nit.require ("http.Context");


test.method ("http.responsefilters.BodyCompressor", "applicableTo")
    .should ("return %{result} if the client accepts %{args[0].req.headers['accept-encoding']} and the response content type is %{args[0].responseHeaders['content-type']}")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.req.headers =
            {
                "accept-encoding": "gzip"
            };

            ctx.responseHeader ("content-type", "text/html");
        }))
        .returns (true)
        .commit ()

    .given (nit.do (Context.new (), ctx =>
        {
            ctx.req.headers =
            {
                "accept-encoding": "gzip"
            };

            ctx.responseHeader ("content-type", "application/gzip");
        }))
        .returns (false)
        .commit ()
;


test.method ("http.responsefilters.BodyCompressor", "apply")
    .should ("skip if the response encoder is not set")
        .given (Context.new ())
        .returns ()
        .commit ()

    .should ("skip if the response cannot be compressed")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "gzip";
            ctx.responseBody = { a: 1 };
        }))
        .returns ()
        .commit ()

    .should ("not compress the response string if the Length is smaller than the threshold")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "gzip";
            ctx.responseBody = "content";
        }))
        .expectingPropertyToBe ("args.0.responseHeaders.ETag")
        .commit ()

    .should ("be able to compress the response string")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "gzip";
            ctx.responseBody = "content";
        }))
        .before (function ()
        {
            this.object.threshold = 4;
        })
        .expectingPropertyToBe ("args.0.responseBody.constructor.name", "Gzip")
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", `"7XACtDnprIRfIjV9giusFERzD722AW0-yUMil7nsn3M-7-g"`)
        .commit ()

    .should ("be able to compress the response buffer")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "deflate";
            ctx.responseBody = Buffer.from ("content");
        }))
        .before (function ()
        {
            this.object.threshold = 4;
        })
        .expectingPropertyToBe ("args.0.responseBody.constructor.name", "Deflate")
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", `"7XACtDnprIRfIjV9giusFERzD722AW0-yUMil7nsn3M-7-d"`)
        .commit ()

    .should ("use the existing ETag if available")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "deflate";
            ctx.responseBody = Readable.from (Buffer.from ("content"));
            ctx.responseHeader ("ETag", `"1234"`);
        }))
        .before (function ()
        {
            this.object.threshold = 4;
        })
        .expectingPropertyToBe ("args.0.responseBody.constructor.name", "Deflate")
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", `"1234-d"`)
        .commit ()

    .should ("skip compression if the size is less than the threshold")
        .up (s => s.createArgs = 100)
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "gzip";
            ctx.response = nit.new ("http.responses.File", nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-two.html"));
        }))
        .before (async (s) => await s.args[0].writeResponse ())
        .expectingPropertyToBe ("args.0.responseBody.constructor.name", "ReadStream")
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", undefined)
        .commit ()

    .should ("use the pre-compressed gzip file if available")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "gzip";
            ctx.response = nit.new ("http.responses.File", nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-one.html"));
        }))
        .before (async (s) => await s.args[0].writeResponse ())
        .expectingPropertyToBe ("args.0.responseBody.constructor.name", "ReadStream")
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", /^W\//)
        .commit ()

    .should ("be able to compress the body stream")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "gzip";
            ctx.response = nit.new ("http.responses.File", nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-two.html"));
        }))
        .before (function ()
        {
            this.object.threshold = 4;
        })
        .before (async (s) => await s.args[0].writeResponse ())
        .expectingPropertyToBe ("args.0.responseBody.constructor.name", "Gzip")
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", /^W\/.*-12-g/)
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Length", undefined)
        .commit ()

    .should ("not compress the body stream if the file size is smaller than the threshold")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "gzip";
            ctx.response = nit.new ("http.responses.File", "resources/html/page-two.html");
        }))
        .expectingPropertyToBe ("args.0.responseHeaders.ETag")
        .commit ()

    .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseEncoding = "gzip";
            ctx.responseBody = Readable.from (Buffer.from ("content"));
        }))
        .expectingPropertyToBe ("args.0.responseHeaders.ETag")
        .commit ()
;
