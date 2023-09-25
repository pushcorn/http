module.exports = function (nit, http)
{
    return http.defineApi ("myapp.apis.GetBlob")
        .info ("Get the blob!")
        .endpoint ("POST", "/blobs")
        .defineRequest (Request =>
        {
            Request
                .parameter ("[content]", "string", "The blob content.")
            ;
        })
        .response ("myapp:BlobReturned")

        .onRun (ctx =>
        {
            let { content } = ctx.request;

            ctx.respond (content);
        })
    ;
};
