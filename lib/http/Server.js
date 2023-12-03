module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.Server"))
        .m ("error.port_in_use", "The port %{port} is already in use.")
        .m ("error.unexpected_error", "%{stack \\|\\| message}")
        .m ("error.shutdown_error", "%{stack \\|\\| message}")
        .m ("info.server_started", "%{name} (%{version}) started on %{address}:%{port}.")
        .m ("info.stopping_server", "Stopping the server...")
        .m ("info.server_stopped", "Server stopped.")
        .m ("warn.force_exit_after_timeout", "Force exit the process after timeout.")
        .use ("*http")
        .use ("*https")
        .use ("*http2")
        .mixin ("http:describable")
        .plugin ("lifecycle-component", "init", "start", "stop", "upgrade", "dispatch", { instancePluginAllowed: true })
        .plugin ("server")

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

        // .plugin ("http:asset-resolver")
        // .plugin ("http:template-loader")
        .property ("sockets", "object")
        .property ("nodeServer", "any")

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
        .staticMethod ("selectObjectForHost", function (objects, host)
        {
            let ctx = http.Context.new ({ headers: { host } });

            return objects.find (o => o.applicableTo (ctx));
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
        .onInitInvocationQueue (function (queue, self, method, args)
        {
            let order = method == "stop" ? "before" : "after";

            queue[order] (`${method}.invokeHook`, `${method}.${method}Hosts`, async function ()
            {
                for (let host of self.hosts)
                {
                    await host[method] (...args);
                }
            });
        })
        .onConfigureQueueForStart (function (queue, self)
        {
            queue.lpush ("init", async function ()
            {
                await self.initialize ();
            });
        })
        .onConfigureQueueForStop (function (queue, self)
        {
            queue.replace ("stop.stopHosts", async function ()
            {
                try
                {
                    for (let host of self.hosts)
                    {
                        await host.stop ();
                    }
                }
                catch (e)
                {
                    self.error ("error.shutdown_error", nit.clone.shallow (e, true));
                }
            });
        })
        .onPreStop (function ()
        {
            this.info ("info.stopping_server");
        })
        .onPostStop (function ()
        {
            this.info ("info.server_stopped");
        })
        .onStop (async function ()
        {
            let self = this;

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
        .onConfigureQueueForDispatch (function (queue, self, args)
        {
            let [req, res] = args;
            let ctx = new http.Context (req, res, { server: self });

            args.splice (0, args.length, ctx);
            self.trackSocketRequest (req, res);

            if (self.oneShot)
            {
                res.on ("finish", () => self.stop ());
            }

            queue
                .replace ("dispatch.dispatchHosts", async function ()
                {
                    for (let host of self.hosts)
                    {
                        if (host.applicableTo (ctx))
                        {
                            await host.dispatch (ctx);
                            break;
                        }
                    }
                })
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
        .onConfigureQueueForUpgrade (function (queue, self)
        {
            queue.replace ("upgrade.upgradeHosts", async function (req, socket, head)
            {
                await Self.selectObjectForHost (self.hosts, req.hostname)?.upgrade (req, socket, head);
            });
        })
        .onStart (async function ()
        {
            let self = this;
            let ssl = self.hosts.some (h => h.certificate);
            let port = ssl ? self.sslPort : self.port;
            let def = new nit.Deferred;

            if (ssl)
            {
                self.nodeServer = (self.http2 ? Self.http2.createSecureServer : Self.https.createServer) (
                {
                    allowHTTP1: true,
                    requestCert: self.requestCert,
                    SNICallback: (host, cb) =>
                    {
                        cb (null, Self.selectObjectForHost (self.hosts, host)?.certificate?.secureContext);
                    }
                });
            }
            else
            {
                self.nodeServer = Self.http.createServer ();
            }

            self.nodeServer.keepAliveTimeout = self.keepAliveTimeout;

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
