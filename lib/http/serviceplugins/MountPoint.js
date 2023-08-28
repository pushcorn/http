module.exports = function (nit, http)
{
    return http.defineServicePlugin ("MountPoint")
        .field ("<prefix>", "string", "The path prefix of the request which should be handled by the service.",
        {
            setter: function (v)
            {
                return "/" + nit.trim (v, "/");
            }
        })
        .onPreInit (function (service)
        {
            service.constructor.condition ("http:request-path-prefix", this.prefix);
        })
        .onPreDispatch (function (service, ctx)
        {
            ctx.enter (ctx.path.slice (this.prefix.length));
        })
        .onPostDispatch (function (service, ctx)
        {
            ctx.leave ();
        })
    ;
};
