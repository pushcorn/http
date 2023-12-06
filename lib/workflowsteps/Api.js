module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Api")
        .field ("<api>", "string", "The API to be invoked.", { exprAllowed: true })
        .field ("parameters", "any", "The request parameters.", () => ({}), { exprAllowed: true })
        .field ("url", "string", "The request URL.", "http://127.0.0.1", { exprAllowed: true })
        .field ("port", "integer?", "The server port.", { exprAllowed: true })
        .field ("insecure", "boolean", "Whether to ignore invalid certs.", { exprAllowed: true })
        .field ("host", "string", "The host header.", { exprAllowed: true })
        .onRun (async function ()
        {
            return await nit.runTask ("http:invoke-api", this.toPojo ());
        })
    ;
};
