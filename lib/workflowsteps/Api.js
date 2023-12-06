module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Api")
        .field ("<api>", "string", "The API to be invoked.")
        .field ("parameters", "any", "The request parameters.", () => ({}))
        .field ("url", "string", "The request URL.", "http://127.0.0.1")
        .field ("port", "integer?", "The server port.")
        .field ("insecure", "boolean", "Whether to ignore invalid certs.")
        .field ("host", "string", "The host header.")
        .onRun (async function ()
        {
            return await nit.runTask ("http:invoke-api", this.toPojo ());
        })
    ;
};
