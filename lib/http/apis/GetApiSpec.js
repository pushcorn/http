module.exports = function (nit, http, Self)
{
    return (Self = http.defineApi ("GetApiSpec"))
        .use ("http.ApiSpec")
        .describe ("Get the API specification.", "http.responses.ApiSpecReturned")
        .endpoint ("GET", "/")
        .property ("spec", "http.ApiSpec")
        .onStart (function ()
        {
            let self = this;
            let spec = new Self.ApiSpec;

            spec.apis = self.service.apis;
            self.spec = spec.sort ();
        })
        .onRun (function (ctx)
        {
            ctx.respond (this.spec);
        })
    ;
};
