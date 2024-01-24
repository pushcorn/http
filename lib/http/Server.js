module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.Server"))
        .k (
            "createNodeServer", "callHosts", "callHost", "initServer", "stopServer", "startNodeServer",
            "logStopping", "closeServer", "logStopped", "logStopError",
            "initContext", "selectHost", "checkResponse", "castError", "writeResponse"
        )
        .m ("error.port_in_use", "The port %{port} is already in use.")
        .m ("error.unexpected_error", "%{stack \\|\\| message}")
        .m ("error.stop_error", "Error stopping the server: %{stack \\|\\| message}")
        .m ("error.start_error", "Error starting the server: %{stack \\|\\| message}")
        .m ("info.server_started", "%{name} (%{version}) started on %{address}:%{port}.")
        .m ("info.stopping_server", "Stopping the server...")
        .m ("info.server_stopped", "Server stopped.")
        .m ("warn.force_exit_after_timeout", "Force exit the process after timeout.")
        .use ("*http")
        .use ("*https")
        .use ("*http2")
        .registerPlugin ("nit.ServiceProvider", true, true)
        .registerPlugin ("http.RequestFilter", false, true)
        .registerPlugin ("http.ResponseFilter", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", "upgrade", "dispatch", { instancePluginAllowed: true })
        .plugin ("server")
        .defaults (
        {
            requestfilters:
            [
                "http:json-body-parser",
                "http:multipart-body-parser",
                "http:url-encoded-body-parser",
                "http:text-body-parser"
            ]
            ,
            responsefilters:
            [
                "http:body-compressor",
                "http:etag-builder",
                "http:cache-controller"
            ]
        })
        .field ("port", "integer", "The non-SSL port.", 80)
        .field ("address", "string", "The listening host name or IP.", "0.0.0.0")
        .field ("name", "string", "The server name.", "nit http server")
        .field ("version", "string", "The server version", () => http.VERSION)
        .field ("sslPort", "integer", "The SSL port.", 443)
        .field ("keepAliveTimeout", "integer", "The Keep-Alive timeout in milliseconds.", 30000)
            .constraint ("min", 0)
        .field ("oneShot", "boolean", "Handle one request then quit. This is used for debugging.")
        .field ("requestCert", "boolean", "Request the client certificate.")
        .field ("http2", "boolean", "Use HTTP/2.", true)
        .field ("stopTimeout", "integer", "The time (ms) to wait before the server ends all connections when it's stopped.", 5 * 1000)
        .field ("logFormat", "string", "The log format string.", "[%{req.hostname|shortHostname}] %{req.realIp} %{user ?? '-'} %{res.statusCode} \"%{req.method} %{req.url}\" HTTP/%{req.httpVersion} %{#+req.userAgent}\"%{req.userAgent}\"%{:}-%{/} %{responseContentLength ?? '-'} %{(elapsed ?? 0) / 1000}")
        .field ("hosts...", "http.Host", "The hosts to be served.", { backref: "server" })
        .field ("hostnames...", "string", "The target host names.")
        .field ("certificate", "http.Certificate", "The SSL certificate.")
        .field ("services...", "http.Service", "The services to run.")

        .property ("sockets", "object")
        .property ("nodeServer", "any")

        .memo ("ssl", function ()
        {
            return this.hosts.some (h => h.certificate);
        })
        .getter ("realIp", function ()
        {
            return this.nodeServer?.address ()?.address;
        })
        .getter ("realPort", function ()
        {
            return this.nodeServer?.address ()?.port;
        })
        .defineLogger (Logger =>
        {
            Logger.superclass
                .meta ("timestamp", nit.coalesce (Logger.superclass.timestamp, true))
            ;

            Logger
                .transform ("shortHostname", function (hostname)
                {
                    return hostname.split (".")
                        .map ((p, i) => (i ? p[0] : p))
                        .join (".")
                    ;
                })
            ;
        })
        .method ("addSocket", function (socket)
        {
            let self = this;

            nit.dpv (socket, "id", socket.id || nit.uuid ());

            self.sockets[socket.id] = socket
                .on ("timeout", function ()
                {
                    socket.end ();
                })
                .on ("close", function ()
                {
                    return self.removeSocket (socket);
                })
            ;

            return this;
        })
        .method ("removeSocket", function (socket)
        {
            delete this.sockets[socket.id];

            return this;
        })
        .method ("trackSocketRequest", function (req, res)
        {
            let self = this;
            let { socket } = req;

            socket.requests.push (req);

            res.once ("finish", function ()
            {
                nit.arrayRemove (socket.requests, req);

                if (self.state == "stopped" && !socket.requests.length)
                {
                    socket.end ();
                }
            });

            return this;
        })
        .method ("endSockets", async function ()
        {
            let self = this;

            await nit.each (self.sockets, async function (socket)
            {
                self.removeSocket (socket);

                try
                {
                    await nit.promisify (socket, "end") ();
                }
                catch (e)
                {
                }
            });
        })
        .memoMethod ("initialize", async function ()
        {
            let self = this;

            Self.Logger.handleGlobalLogging (Self);

            await self.init ();

            return self;
        })
        .onConstruct (function ()
        {
            let self = this;
            let defaultHost = nit.pick (self, "hostnames", "services", "certificate");

            if (!nit.is.empty.nested (defaultHost))
            {
                self.hosts.push (defaultHost);
            }
        })
        .configureComponentMethod ("init", Method =>
        {
            Method
                .before (Self.kCreateNodeServer, (self) =>
                {
                    if (self.ssl)
                    {
                        self.nodeServer = (self.http2 ? Self.http2.createSecureServer : Self.https.createServer) (
                        {
                            allowHTTP1: true,
                            requestCert: self.requestCert,
                            SNICallback: (hostname, cb) =>
                            {
                                let host = http.selectApplicableObject (self.hosts, hostname);

                                cb (null, host?.certificate?.secureContext);
                            }
                        });
                    }
                    else
                    {
                        self.nodeServer = Self.http.createServer ();
                    }

                    self.nodeServer.keepAliveTimeout = self.keepAliveTimeout;
                })
                .after ("init.applyPlugins", Self.kCallHosts, async function (self)
                {
                    for (let host of self.hosts)
                    {
                        await host.init (...this.args);
                    }
                })
                .afterComplete (Self.kReturnServer, self => self)
            ;
        })
        .configureComponentMethod ("start", Method =>
        {
            Method
                .after (Self.kStopIfStarted, Self.kInitServer, async function (self)
                {
                    await self.initialize ();
                })
                .after ("start", Self.kStartNodeServer, (self) => self.startNodeServer ())
                .after ("start.applyPlugins", Self.kCallHosts, async function (self)
                {
                    for (let host of self.hosts)
                    {
                        await host.start (...this.args);
                    }
                })
                .beforeFailure (Self.kStopServer, function (self)
                {
                    self.error ("error.start_error", nit.clone.shallow (this.error, true));

                    this.error = null;

                    return self.stop ();
                })
            ;
        })
        .configureComponentMethod ("stop", Method =>
        {
            Method
                .after (Self.kStopIfStopped, Self.kLogStopping, self => self.info ("info.stopping_server"))
                .after (Self.kLogStopping, Self.kCloseServer, async function (self)
                {
                    await self.endSockets ();

                    let { nodeServer } = self;

                    nodeServer?.removeAllListeners ();

                    if (nodeServer?.listening)
                    {
                        await nit.promisify (nodeServer, "close") ();
                    }

                    if (self.stopTimeout)
                    {
                        setTimeout (() => { self.warn ("warn.force_exit_after_timeout"); process.exit (0); }, self.stopTimeout).unref (); // eslint-disable-line no-process-exit
                    }
                })
                .after ("stop", Self.kCallHosts, async function (self)
                {
                    for (let host of self.hosts)
                    {
                        await host.stop (...this.args);
                    }
                })
                .before ("after", Self.kLogStopped, self => self.info ("info.server_stopped"))
                .beforeFailure (Self.kLogStopError, function (self)
                {
                    self.error ("error.stop_error", nit.clone.shallow (this.error, true));
                    this.error = null;
                })
            ;
        })
        .configureComponentMethod ("upgrade", Method =>
        {
            Method
                .after ("upgrade.applyPlugins", Self.kCallHost, (self, req, socket, head) => http.selectApplicableObject (self.hosts, req)?.upgrade (req, socket, head))
                .afterComplete (Self.kReturnServer, self => self)
            ;
        })
        .configureComponentMethod ("dispatch", Method =>
        {
            Method
                .before (Self.kInitContext, async function (self, req, res)
                {
                    let ctx = new http.Context (req, res, { server: self });

                    this.args = ctx;

                    self.trackSocketRequest (req, res);

                    if (self.oneShot)
                    {
                        res.on ("finish", () => self.stop ());
                    }
                })
                .after (Self.kInitContext, Self.kSelectHost, (self, ctx) => ctx.host = http.selectApplicableObject (self.hosts, ctx))
                .after ("dispatch.applyPlugins", Self.kCallHost, async (self, ctx) => ctx.host?.dispatch (ctx))
                .afterSuccess (Self.kCheckResponse, (self, ctx) => ctx.response = ctx.response || http.responseFor (404))
                .beforeFailure (Self.kCastError, function (self, ctx)
                {
                    let error = this.error;

                    if (nit.is.int (error))
                    {
                        ctx.response = http.responseFor (error);
                    }
                    else
                    if (error instanceof http.Response)
                    {
                        ctx.response = error;
                    }
                    else
                    {
                        self.error ("error.unexpected_error", nit.clone.shallow (error, true));

                        ctx.response = nit.new ("http.responses.RequestFailed", { code: error.code });
                    }

                    this.error = null;
                })
                .afterComplete (Self.kWriteResponse, async (self, ctx) =>
                {
                    try
                    {
                        await ctx.writeResponse ();
                    }
                    catch (error)
                    {
                        self.error ("error.unexpected_error", nit.clone.shallow (error, true));

                        nit.invoke.silent ([ctx.res, "writeHead"], 500);
                        nit.invoke.silent ([ctx.res, "end"]);
                    }

                    self.info (self.logFormat, ctx);

                    return ctx.destroy ();
                })
            ;
        })
        .method ("startNodeServer", async function ()
        {
            let self = this;
            let port = self.ssl ? self.sslPort : self.port;
            let def = new nit.Deferred;

            function stop ()
            {
                nit.SHUTDOWN_EVENTS.forEach (e => process.removeListener (e, stop));

                return self.stop ();
            }

            nit.SHUTDOWN_EVENTS.forEach (e => process.on (e, stop));

            self.nodeServer
                .on ("connection", function (socket)
                {
                    self.addSocket (socket);
                })
                .on ("request", function (req, res)
                {
                    return self.dispatch (req, res);
                })
                .on ("upgrade", async function (req, socket, head)
                {
                    await self.upgrade (req, socket, head);
                })
                .on ("error", async function (e)
                {
                    await self.stop ();

                    if (e.code == "EADDRINUSE")
                    {
                        self.throw ("error.port_in_use", { port });
                    }

                    throw e;
                })
                .listen (port, self.address, async function ()
                {
                    self.info ("info.server_started", self.nodeServer.address (), nit.pick (self, "name", "version"));

                    def.resolve (self);
                })
            ;

            return def.promise;
        })
    ;
};
