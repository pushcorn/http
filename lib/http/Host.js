module.exports = function (nit, http)
{
    return http.defineConditional ("http.Host")
        .defineInstanceDescriptor (Descriptor =>
        {
            Descriptor
                .field ("names...", "string", "The target host names.")
                .field ("services...", "http.Service.Descriptor")
                .field ("requestFilters...", "http.RequestFilter.Descriptor", "The request filters.")
                .field ("responseFilters...", "http.ResponseFilter.Descriptor", "The response filters.")
                .field ("certificate", "http.Certificate.Descriptor", "The SSL certificate.")
                // assetResolvers and templateLoaders from plugins

                .onConfigure (function (host)
                {
                    let self = this;

                    host.names = self.names;
                    host.services.push (...self.services.map (s => s.build ()));
                    host.certificate = self.certificate?.build ();
                    host.requestFilters.push (...self.requestFilters.map (f => f.build ()));
                    host.responseFilters.push (...self.responseFilters.map (f => f.build ()));
                })
            ;
        })
        .field ("names...", "string", "The target host names.",
        {
            setter: function (v)
            {
                if (!nit.is.empty (v))
                {
                    this.constructor.condition ("http:hostname", ...v);
                }

                return v;
            }
        })
        .field ("services...", "http.Service", "The services to run.")
        .field ("certificate", "http.Certificate", "The certificate to use.")
        .field ("requestFilters...", "http.RequestFilter", "The request filters.")
        .field ("responseFilters...", "http.ResponseFilter", "The response filters.")
        .plugin ("http:asset-resolver")
        .plugin ("http:template-loader")

        .getter ("name", function ()
        {
            return this.names[0] || "";
        })
        .method ("init", async function (server)
        {
            for (let service of this.services)
            {
                await service.init (server);
            }
        })
        .method ("upgrade", async function (req, socket, head)
        {
            for (let service of this.services)
            {
                await service.upgrade (req, socket, head);
            }
        })
        .method ("start", async function ()
        {
            for (let service of this.services)
            {
                await service.start ();
            }
        })
        .method ("stop", async function ()
        {
            for (let service of this.services)
            {
                await service.stop ();
            }
        })
        .method ("dispatch", async function (ctx)
        {
            let self = this;

            ctx.host = self;
            ctx.requestFilters.push (...self.requestFilters);
            ctx.responseFilters.push (...self.responseFilters);

            await self.services.find (s => s.applicableTo (ctx))?.dispatch (ctx);
        })
    ;
};
