module.exports = function (nit, http, Self)
{
    return (Self = http.defineService ("AutoRestart"))
        .use ("*chokidar")
        .condition ("http:custom", () => false)
        .field ("<assets...>", "string", "The assets (files or dirs) to watch.", ["lib", "resources", "nit.json", "nit.local.json"])
        .field ("[exitCode]", "integer", "The server exit code.", 64)
        .field ("[delay]", "integer", "Time to wait before restarting the server.", 500)
        .property ("watcher", "any")
        .memo ("assetPaths", function ()
        {
            let paths = [];

            nit.each (this.assets, a =>
            {
                if (nit.path.isAbsolute (a))
                {
                    paths.push (a);
                }
                else
                {
                    paths.push (...nit.ASSET_PATHS.map (p => nit.path.join (p, a)));
                }
            });

            return paths;
        })
        .onStart (function ()
        {
            let self = this;

            let restart = nit.debounce (self.delay, async function ()
            {
                await self.server.stop ();

                nit.beep (3);
                process.exit (self.exitCode); // eslint-disable-line no-process-exit
            });

            self.watcher = Self.chokidar
                .watch (self.assetPaths, { ignoreInitial: true })
                .on ("all", restart)
            ;
        })
        .onStop (async function ()
        {
            await this.watcher.close ();
        })
    ;
};
