const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");
const IMG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACJSURBVEhL7ZC9CYBADEbP2iEEp7JxAPdwBZex02EcQ/0iBCzC/ZlTkDx4RYrLC+cMwzB+QQ1bRRtYwSAbPJQdoRe6bIbS41x32MEg9NULlJakStEBRqMRT44yFF+htDRkdpTJiT+OMilxtSgTE1ePMr54sSgjxYtHmXv8tShD8Qn212QYxnc4dwKskJKEHrOFUQAAAABJRU5ErkJggg==";
const IMG = Buffer.from (IMG_BASE64, "base64");


test.task ("http:invoke-api")
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
        .after (async (s) =>
        {
            await s.testUp (
            {
                api: "myapp:hello",
                url: "http://127.0.0.1",
                port: s.server.realPort
            });

            s.result2 = await s.test ();
        })
        .after (s => s.server.stop ())
        .mock ("server", "info")
        .returnsResultContaining (
        {
            statusCode: 200,
            statusMessage: 'The hello message has been returned.',
            isJson: true,
            isText: true,
            contentType: "application/json",
            headers:
            {
                'x-response-name': 'myapp.responses.HelloMessageReturned',
                'content-type': 'application/json',
                'content-length': '33',
                etag: '"ULulLvzruKc0n8EQ_BaQBzguiRsLAuKGXQsr76hDeYA-11"',
                'cache-control': 'no-cache',
                connection: 'keep-alive',
                'keep-alive': 'timeout=30'
            },
            body:
            {
                message: 'Hello Mr. John Doe!'
            }
        })
        .expectingPropertyToBe ("result2.headers.x-response-name", "http.responses.ValidationFailed")
        .commit ()

    .should ("handle the form params for a POST request")
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

            s.args =
            {
                api: "myapp:check-in",
                port: s.server.realPort,
                parameters:
                {
                    userId: "1234",
                    location:
                    {
                        latitude: 33,
                        longitude: 44
                    }
                }
            };
        })
        .after (s => s.server.stop ())
        .mock ("server", "info")
        .returnsResultContaining (
        {
            statusCode: 201,
            statusMessage: 'The check-in info has been recorded.'
        })
        .commit ()

    .should ("handle the binary response")
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

            s.args =
            {
                api: "myapp:get-blob",
                port: s.server.realPort,
                parameters:
                {
                    content: IMG_BASE64
                }
            };
        })
        .after (s => s.server.stop ())
        .mock ("server", "info")
        .returnsResultContaining (
        {
            statusCode: 200,
            body: IMG.toString ("binary")
        })
        .commit ()

    .should ("convert nit.Object to pojo")
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

            s.args =
            {
                api: "myapp:check-in",
                port: s.server.realPort,
                parameters:
                {
                    userId: "1234",
                    location: nit.lookupComponent ("myapp:check-in", "apis")
                        .Request.Location (33, 44)
                }
            };
        })
        .after (s => s.server.stop ())
        .mock ("server", "info")
        .returnsResultContaining (
        {
            statusCode: 201,
            statusMessage: 'The check-in info has been recorded.'
        })
        .commit ()

    .should ("handle the SSL connection")
        .project ("myapp", true)
        .init (async (s) =>
        {
            s.server = s.createServer (
            {
                hostnames: "app.pushcorn.com",
                services: "http:api-server",
                certificate:
                {
                    cert: CERTS_DIR.join ("pushcorn.com.crt"),
                    key: CERTS_DIR.join ("pushcorn.com.key")
                }
            });
        })
        .up (async (s) =>
        {
            await s.server.start ();

            s.args =
            {
                api: "myapp:hello",
                url: "https://127.0.0.1",
                host: "app.pushcorn.com",
                port: s.server.realPort,
                insecure: true,
                parameters:
                {
                    name: "Jane Doe"
                }
            };
        })
        .after (s => s.server.stop ())
        .mock ("server", "info")
        .returnsResultContaining (
        {
            statusCode: 200,
            statusMessage: 'The hello message has been returned.'
        })
        .commit ()

;
