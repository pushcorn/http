test.method ("http.responses.FileReturned", "toBody")
    .should ("return read stream for the file")
        .init (s => s.createArgs = "resources/html/page-two.html")
        .returnsInstanceOf (require ("stream"))
        .expecting ("the content is %{value|format}", "This is page two!\n", async function (s)
        {
            return await nit.readStream (s.result);
        })
        .commit ()
;


test.object ("http.responses.FileReturned")
    .should ("throw if the file was not found")
        .given ("resources/html/page-three.html")
        .throws (/path.*invalid/)
        .commit ()
;
