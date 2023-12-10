module.exports = function (nit, http)
{
    return http.defineService ("ApiServer", "http.HandlerService")
        .forHandler ("http.Api")
        .onPostDispatch (function (ctx)
        {
            ctx.responseHeader ("X-Response-Name", ctx.response?.constructor.name);
        })
    ;
};
