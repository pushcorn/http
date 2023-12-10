module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.Server"))
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
        .registerPlugin ("http.RequestFilter", false, true)
        .registerPlugin ("http.ResponseFilter", false, true)
        .registerPlugin ("http.TemplateLoader", false, true)
        .registerPlugin ("http.AssetResolver", false, true)
        .plugin ("lifecycle-component", "init", "start", "stop", { instancePluginAllowed: true })
        .plugin ("server")
        .componentMethod ("dispatch", false)
        .componentMethod ("upgrade", false)
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
            return this.nodeServer.address ().address;
        })
        .getter ("realPort", function ()
        {
            return this.nodeServer.address ().port;
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
        .onInitInvocationQueue (function (queue, self, method, args)
        {
            if (method.match (/dispatch$/i) || method.match (/upgrade$/i))
            {
                return;
            }

            if (method.match (/stop$/i))
            {
                queue.before (`${method}.invokeHook`, `${method}.callHosts`, async function ()
                {
                    for (let host of self.hosts)
                    {
                        await host[method] (...args);
                    }
                });
            }
            else
            {
                queue.after (`${method}.applyPlugins`, `${method}.callHosts`, async function ()
                {
                    for (let host of self.hosts)
                    {
                        await host[method] (...args);
                    }
                });
            }

            queue.complete (() => self);
        })
        .onConfigureQueueForStop (function (queue, self)
        {
            queue
                .after ("preStop.returnIfStarted", "preStop.log", () => self.info ("info.stopping_server"))
                .before ("postStop", "postStop.log", () => self.info ("info.server_stopped"))
                .before ("stop.callHosts", "stop.closeServer", async function ()
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
                .failure (function (c)
                {
                    self.error ("error.stop_error", nit.clone.shallow (c.error, true));
                })
            ;
        })
        .onConfigureQueueForUpgrade (function (queue, self, [req, socket, head])
        {
            let host = http.selectApplicableObject (self.hosts, req);

            queue
                .lpush ("preUpgrade", self.preUpgrade.bind (self, req, socket, head))
                .after ("upgrade.applyPlugins", "upgrade.callHost", () => host?.upgrade (req, socket, head))
                .complete (() => nit.invoke.return ([self, "postUpgrade"], [req, socket, head], self))
            ;
        })
        .onConfigureQueueForDispatch (function (queue, self, args)
        {
            let [req, res] = args;
            let ctx = new http.Context (req, res, { server: self });

            ctx.host = http.selectApplicableObject (self.hosts, ctx);

            args.splice (0, args.length, ctx);
            self.trackSocketRequest (req, res);

            if (self.oneShot)
            {
                res.on ("finish", () => self.stop ());
            }

            queue
                .lpush ("preDispatch", self.preDispatch.bind (self, ctx))
                .after ("dispatch.applyPlugins", "dispatch.callHost", () => ctx.host?.dispatch (ctx))
                .success (() =>
                {
                    ctx.response = ctx.response || http.responseFor (404);
                })
                .failure (({ error }) =>
                {
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
                })
                .complete (async () =>
                {
                    try
                    {
                        await self.postDispatch (ctx);
                        await ctx.writeResponse ();
                    }
                    catch (error)
                    {
                        self.error ("error.unexpected_error", nit.clone.shallow (error, true));

                        nit.invoke.silent ([res, "writeHead"], 500);
                        nit.invoke.silent ([res, "end"]);
                    }

                    self.info (self.logFormat, ctx);

                    return ctx;
                })
            ;
        })
        .onConfigureQueueForStart (function (queue, self)
        {
            queue
                .lpush ("init", async function ()
                {
                    await self.initialize ();
                })
                .before ("preStart.invokeHook", "preStart.createNodeServer", () =>
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
                .before ("start.invokeHook", "start.startNodeServer", () => self.startNodeServer ())
                .failure (function (c)
                {
                    self.error ("error.start_error", nit.clone.shallow (c.error, true));

                    return self.stop ();
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

                self.stop ();
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
