module.exports = function (nit, http)
{
    return http.defineApi ("myapp.apis.GetBlob")
        .describe ("Get the blob!")
        .endpoint ("POST", "/blobs")
        .defineRequest (Request =>
        {
            Request
                .parameter ("[content]", "string", "The blob content in Base64.")
            ;
        })
        .response ("myapp:BlobReturned")

        .onDispatch (ctx =>
        {
            let { content } = ctx.request;

            ctx.respond (Buffer.from (content, "base64"));
        })
    ;
};
