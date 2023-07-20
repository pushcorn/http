module.exports = function (nit, http, Self)
{
    return (Self = http.defineApi ("GetApiSpec"))
        .use ("http.ApiSpec")
        .info ("Get the API specification.")
        .endpoint ("GET", "/")
        .response ("http.responses.ApiSpecReturned")
        .onRun (function (ctx)
        {
            let spec = new Self.ApiSpec ();

            ctx.root.service.apis.forEach (api => spec.import (api.constructor));

            ctx.send (spec);
        })
    ;
};
