module.exports = function (nit, http, Self)
{
    return (Self = http.defineService ("LiveReload"))
        .m ("error.socket_io_required", "The Socket.IO plugin is required.")
        .use ("*chokidar")
        .field ("<dirs...>", "dir", "The directories to watch.",
        {
            defval: function ()
            {
                return nit.ASSET_PATHS.map (p => nit.path.join (p, "public"));
            }
        })
        .field ("[delay]", "integer", "Time to wait before notifying the client.", 500)
        .property ("watcher", "any")
        .memo ("socketIoService", function ()
        {
            return this.host.lookupService ("http:socket-io");
        })
        .onPostStart (function ()
        {
            let self = this;

            if (!self.socketIoService)
            {
                self.throw ("error.socket_io_required");
            }

            let notify = nit.debounce (self.delay, function ()
            {
                self.socketIoService.send ("POST", "/live-reloads");
            });

            self.watcher = Self.chokidar
                .watch (self.dirs, { ignoreInitial: true })
                .on ("all", notify)
            ;
        })
        .onPreStop (async function ()
        {
            await this.watcher.close ();
        })
    ;
};
