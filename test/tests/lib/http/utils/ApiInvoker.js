const CERTS_DIR = nit.new ("nit.Dir", test.TEST_PROJECT_PATH).subdir ("resources/certs");
const IMG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACJSURBVEhL7ZC9CYBADEbP2iEEp7JxAPdwBZex02EcQ/0iBCzC/ZlTkDx4RYrLC+cMwzB+QQ1bRRtYwSAbPJQdoRe6bIbS41x32MEg9NULlJakStEBRqMRT44yFF+htDRkdpTJiT+OMilxtSgTE1ePMr54sSgjxYtHmXv8tShD8Qn212QYxnc4dwKskJKEHrOFUQAAAABJRU5ErkJggg==";
const IMG = Buffer.from (IMG_BASE64, "base64");


test.method ("http.utils.ApiInvoker", "invoke")
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

            s.createArgs =
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
        .mock (process.stdout, "write")
        .down (() =>
        {
            process.stdout.isTTY = true;
        })
        .returns (nit.trim.text`
        {
          "message": "Hello Mr. John Doe!"
        }
        `)
        .commit ()

    .should ("show the response on error")
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

            s.createArgs =
            {
                api: "myapp:hello",
                port: s.server.realPort
            };
        })
        .after (s => s.server.stop ())
        .mock ("server", "info")
        .mock (process.stderr, "write")
        .returns (new RegExp (nit.escapeRegExp (nit.trim.text`
        {
          "violations": [
            {
              "field": "name",
              "constraint": "",
              "code": "error.value_required",
              "message": "The parameter 'name' is required."
            }
          ]
        }
        `)))
        .commit ()

    .should ("not print the headers if silent is true")
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
            process.stdout.isTTY = true;

            s.createArgs =
            {
                api: "myapp:hello",
                port: s.server.realPort,
                silent: true
            };
        })
        .after (s => s.server.stop ())
        .after (s => s.exitCode = process.exitCode)
        .mock ("server", "info")
        .mock (process.stderr, "write")
        .down (() =>
        {
            process.exitCode = 0;
            process.stdout.isTTY = false;
        })
        .returns (new RegExp (nit.escapeRegExp (nit.trim.text`
        {
          "violations": [
            {
              "field": "name",
              "constraint": "",
              "code": "error.value_required",
              "message": "The parameter 'name' is required."
            }
          ]
        }
        `)))
        .expectingPropertyToBe ("mocks.1.invocations.length", 0)
        .expectingPropertyToBe ("exitCode", 1)
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
            process.stdout.isTTY = false;

            s.createArgs =
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
        .mock (process.stdout, "write")
        .down (() =>
        {
            process.stdout.isTTY = true;
        })
        .returns ()
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /201/)
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
            process.stdout.isTTY = false;

            s.createArgs =
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
        .mock (process.stdout, "write")
        .down (() =>
        {
            process.stdout.isTTY = true;
        })
        .returns ()
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /201/)
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
            process.stdout.isTTY = false;

            s.createArgs =
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
        .mock (process.stdout, "write")
        .down (() => process.stdout.isTTY = true)
        .returns (IMG.toString ("binary"))
        .commit ()

    .should ("handle the text response")
        .project ("myapp", true)
        .up (async (s) =>
        {
            s.createArgs = "myapp:hello";

            process.stdout.isTTY = false;
        })
        .down (() => process.stdout.isTTY = true)
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
        .mock ("server", "info")
        .mock (process.stderr, "write")
        .returns ("NOT_OK")
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
            process.stdout.isTTY = false;

            s.createArgs =
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
        .down (() => process.stdout.isTTY = true)
        .mock ("server", "info")
        .mock (process.stdout, "write")
        .expectingPropertyToBe ("mocks.1.invocations.0.args.0", /200 The hello/)
        .commit ()

;
