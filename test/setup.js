nit.arrayRemove (nit.SHUTDOWN_EVENTS, "SHUTDOWN");


nit.test.Strategy
    .memo ("http", () => nit.require ("http"))
    .memo ("Xhr", () => nit.require ("http.Xhr"))
    .memo ("XmlHttpRequest", () => nit.require ("http.mocks.XmlHttpRequest"))
    .memo ("IncomingMessage", () => nit.require ("http.mocks.IncomingMessage"))
    .memo ("ServerResponse", () => nit.require ("http.mocks.ServerResponse"))
    .memo ("NodeHttpServer", () => nit.require ("http.mocks.NodeHttpServer"))
    .memo ("Socket", () => nit.require ("http.mocks.Socket"))
    .memo ("Context", () => nit.require ("http.Context"))
    .memo ("Server", () => nit.require ("http.Server"))
    .memo ("Host", () => nit.require ("http.Host"))
    .memo ("Service", () => nit.require ("http.Service"))
    .memo ("Api", () => nit.require ("http.Api"))
    .memo ("Action", () => nit.require ("http.Action"))
    .memo ("Handler", () => nit.require ("http.Handler"))
    .memo ("ApiSpec", () => nit.require ("http.ApiSpec"))
    .memo ("Cookies", () => nit.require ("http.Cookies"))
    .memo ("Crypto", () => nit.require ("nit.utils.Crypto"))
    .memo ("stream", () => require ("stream"))

    .method ("givenContext", function ()
    {
        return this.given (this.Context.new (...arguments));
    })
    .method ("bufferToStream", function (buf)
    {
        return this.stream.Readable.from (Buffer.from (buf));
    })
    .method ("writePropertyToFile", function (property, filename, ext)
    {
        let v = nit.get (this, property);

        return this.writeDataForFile (nit.toJson (v instanceof nit.Object ? v.toPojo () : v, "  "), filename, ext);
    })
    .method ("writeDataForFile", function (data, filename, ext)
    {
        let self = this;

        filename = filename.replace (/\.js$/, ext || ".data.json");

        if (!nit.fs.existsSync (filename)
            || self.Crypto.md5 (data) != self.Crypto.md5 (nit.fs.readFileSync (filename)))
        {
            nit.fs.writeFileSync (filename, data);
        }

        return self;
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
    .method ("createServer", function (options)
    {
        options = nit.assign ({ hostnames: "*", port: 0, sslPort: 0, stopTimeout: 0 }, options);

        return new this.http.Server (options);
    })
    .method ("createService", function (options)
    {
        return new this.http.Service (options);
    })
    .method ("useApi", function (options)
    {
        return this
            .before (s =>
            {
                s.server = s.server || s.createServer ();
                s.service = s.service || s.createService ();

                s.server.hosts[0].services.push (s.service);
                s.service.apis.push (options);
                s.api = s.service.apis[0];
            })
        ;
    })
    .method ("useService", function (options)
    {
        return this
            .before (s =>
            {
                s.server = s.server || s.createServer ();
                s.service = s.service || s.createService (options);

                s.server.hosts[0].services.push (s.service);
            })
        ;
    })
    .method ("useServer", function (options)
    {
        return this
            .up (s =>
            {
                s.server = s.createServer (options);
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
    .method ("expectingPropertyJsonToBe", function (property, filename, ext)
    {
        const self = this;

        filename = filename.replace (/\.js$/, ext || ".data.json");

        self.expecting (`the JSON of ${property} to be %{value}`,
            nit.fs.readFileSync (filename, "utf8"),
            function ()
            {
                let v = nit.get (self, property);

                return nit.toJson (v instanceof nit.Object ? v.toPojo () : v, "  ");
            }
        );

        self.expectors[self.expectors.length - 1].validator.sourceLine = self.constructor.getSourceLine (__filename);

        return self;
    })
;
