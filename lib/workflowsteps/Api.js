module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("Api"))
        .use ("http.utils.ApiInvoker")
        .field ("<api>", "string", "The API to be invoked.")
        .field ("parameters", "any", "The request parameters.", () => ({}))
        .field ("url", "string", "The request URL.", "http://127.0.0.1")
        .field ("port", "integer?", "The server port.")
        .field ("silent", "boolean", "Whether to print the response headers.")
        .field ("insecure", "boolean", "Whether to ignore invalid certs.")
        .field ("host", "string", "The host header.")

        .onRun (async function ()
        {
            let res = await Self.ApiInvoker (this.toPojo ()).fetch ();

            if (res.isText)
            {
                let text = await res.text ();

                res.body = res.isJson ? JSON.parse (text) : text;
            }
            else
            {
                res.body = await res.binary ();
            }

            return nit.pick (res, "statusCode", "statusMessage", "headers", "body");
        })
    ;
};
