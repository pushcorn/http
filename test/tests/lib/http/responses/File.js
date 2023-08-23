test.method ("http.responses.File", "toBody")
    .should ("throw if the file was not found.")
        .up (s => s.createArgs = "resources/html/page-two.html")
        .before (s => s.args = s.http.Context.new ())
        .throws ("error.file_not_found")
        .commit ()

    .should ("return read stream for the file")
        .up (s => s.createArgs = "file://test/resources/html/page-two.html")
        .before (s => s.args = s.http.Context.new ())
        .returnsInstanceOf (require ("stream"))
        .expecting ("the content is %{value|format}", "This is page two!\n", async function (s)
        {
            return await nit.readStream (s.result);
        })
        .commit ()

    .should ("accept an absolute path")
        .up (s => s.createArgs = nit.path.join (test.TEST_PROJECT_PATH, "resources/html/page-two.html"))
        .before (s => s.args = s.http.Context.new ())
        .returnsInstanceOf (require ("stream"))
        .expecting ("the content is %{value|format}", "This is page two!\n", async function (s)
        {
            return await nit.readStream (s.result);
        })
        .commit ()

    .should ("use the given content type")
        .up (s => s.createArgs = ["file://test/resources/html/page-two.html", "text/plain"])
        .before (s => s.args = s.http.Context.new ())
        .returnsInstanceOf (require ("stream"))
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/plain")
        .commit ()
;
