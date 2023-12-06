const IMG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACJSURBVEhL7ZC9CYBADEbP2iEEp7JxAPdwBZex02EcQ/0iBCzC/ZlTkDx4RYrLC+cMwzB+QQ1bRRtYwSAbPJQdoRe6bIbS41x32MEg9NULlJakStEBRqMRT44yFF+htDRkdpTJiT+OMilxtSgTE1ePMr54sSgjxYtHmXv8tShD8Qn212QYxnc4dwKskJKEHrOFUQAAAABJRU5ErkJggg==";


test.workflowStep ("workflowsteps.Api")
    .should ("invoke a server API")
        .project ("myapp", true)
        .init (async (s) =>
        {
            s.server = s.createServer (
            {
                services: "http:api-server"
            });
        })
        .up (async (s) =>
        {
            await s.server.start ();
            process.stdout.isTTY = false;

            s.args =
            {
                api: "myapp:hello",
                url: "http://127.0.0.1",
                port: s.server.realPort,
                parameters:
                {
                    name: "John Doe",
                    title: "Mr."
                }
            };
        })
        .after (s => s.server.stop ())
        .mock ("server", "info")
        .expectingPropertyToContain ("result.output",
        {
            "statusCode": 200,
            "statusMessage": "The hello message has been returned.",
            "headers":
            {
                "x-response-name": "HelloMessageReturned",
                "content-type": "application/json",
                "content-length": "33",
                "etag": "\"ULulLvzruKc0n8EQ_BaQBzguiRsLAuKGXQsr76hDeYA-11\"",
                "cache-control": "no-cache",
                "connection": "keep-alive",
                "keep-alive": "timeout=30"
            },
            "body":
            {
                "message": "Hello Mr. John Doe!"
            }
        })
        .commit ()

    .should ("handle the binary result")
        .project ("myapp", true)
        .init (async (s) =>
        {
            s.server = s.createServer (
            {
                services: "http:api-server"
            });
        })
        .up (async (s) =>
        {
            await s.server.start ();
            process.stdout.isTTY = false;

            s.args =
            {
                api: "myapp:get-blob",
                url: "http://127.0.0.1",
                port: s.server.realPort,
                parameters:
                {
                    content: IMG_BASE64
                }
            };
        })
        .after (s => s.server.stop ())
        .after (s => s.result.output.body = Buffer.from (s.result.output.body, "binary").toString ("base64"))
        .mock ("server", "info")
        .expectingPropertyToContain ("result.output",
        {
            statusCode: 200,
            statusMessage: 'The blob has been returned.',
            headers: {
                'x-response-name': 'BlobReturned',
                'content-type': 'application/octet-stream',
                'content-length': '244',
                connection: 'keep-alive',
                'keep-alive': 'timeout=30'
            },
            body: IMG_BASE64
        })
        .commit ()

    .should ("handle the text response")
        .project ("myapp", true)
        .given ("myapp:hello")
        .mock ("http", "fetch", function ()
        {
            let s = this.strategy;

            return nit.assign (s.bufferToStream ("NOT_OK"),
            {
                isText: true,
                statusCode: 400,
                text: function () { return nit.readStream (this); },
                headers:
                {
                    "content-length": 6,
                    "content-type": "text/plain"
                }
            });
        })
        .expectingPropertyToContain ("result.output",
        {
            statusCode: 400,
            headers: { 'content-length': 6, 'content-type': 'text/plain' },
            body: 'NOT_OK'
        })
        .commit ()
;
