nit.test.Strategy
    .memo ("http", () => nit.require ("http"))
    .memo ("Xhr", () => nit.require ("http.Xhr"))
    .memo ("XmlHttpRequest", () => nit.require ("http.mocks.XmlHttpRequest"))
    .memo ("Context", () => nit.require ("http.Context"))
    .memo ("Service", () => nit.require ("http.Service"))
    .memo ("Api", () => nit.require ("http.Api"))
    .memo ("ApiSpec", () => nit.require ("http.ApiSpec"))
    .memo ("Cookies", () => nit.require ("http.Cookies"))

    .method ("givenContext", function ()
    {
        return this.given (this.Context.new (...arguments));
    })
    .method ("mockXhrSend", function ()
    {
        const { XmlHttpRequest, http } = this;

        return this.mock (XmlHttpRequest, XmlHttpRequest.kSend, async function ()
        {
            let xhr = this.obj;
            let result = await http.fetch (
            {
                url: xhr.url,
                method: xhr.method,
                headers: xhr.requestHeaders,
                timeout: xhr.timeout,
                body: xhr.data
            });

            xhr.status = result.statusCode;
            xhr.statusText = result.statusMessage;
            xhr.responseHeaders = result.headers;
            xhr.responseText = await nit.readStream (result);
        });
    })
    .method ("createServer", function (descriptor)
    {
        descriptor = descriptor || { names: "*" };
        descriptor.options = nit.assign.defined ({ port: 0, sslPort: 0, stopTimeout: 0 }, descriptor.options);

        return this.http.Server.Descriptor.build (descriptor);
    })
    .method ("createService", function (descriptor)
    {
        return this.http.Service.Descriptor.build (descriptor);
    })
    .method ("useApi", function (descriptor)
    {
        return this
            .before (s =>
            {
                s.server = s.server || s.createServer ();
                s.service = s.service || s.createService ();
                s.api = s.Api.Descriptor.build (descriptor);

                s.server.hosts[0].services.push (s.service);
                s.service.handlers.push (s.api);
            })
        ;
    })
    .method ("useService", function (descriptor)
    {
        return this
            .before (s =>
            {
                s.server = s.server || s.createServer ();
                s.service = s.service || s.createService (descriptor);

                s.server.hosts[0].services.push (s.service);
            })
        ;
    })
    .method ("useServer", function (descriptor)
    {
        return this
            .up (s =>
            {
                s.server = s.createServer (descriptor);
            })
            .before (async (s) =>
            {
                await s.server.start ();
                await nit.sleep (10);

                s.baseUrl = (s.server.hosts.some (h => h.certificate) ? "https" : "http")
                    + "://127.0.0.1:"
                    + s.server.realPort
                ;
            })
            .mock ("server", "info")
            .deinit (async (s) =>
            {
                await nit.sleep (10);
                await s.server?.stop ();

                s.server = null;
            })
        ;
    })
;
