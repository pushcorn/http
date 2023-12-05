module.exports = function (nit, http)
{
    return nit.defineCommand ("http.commands.Fetch")
        .describe ("Fetch the content from the given URL.")
        .defineInput (Input =>
        {
            Input
                .option ("<url>", "string", "The request URL.")
                .option ("auth", "string?", "Basic authentication ('user:password') to compute an Authorization header.")
                .option ("headers...", "any", "The request headers.")
                .option ("method", "string", "A string specifying the HTTP request method.", "GET")
                    .constraint ("choice", "GET", "PUT", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS")
                .option ("timeout", "integer?", "A number specifying the socket timeout in milliseconds. This will set the timeout before the socket is connected.")
                .option ("rejectUnauthorized", "boolean", "Whether to reject connections with unverified certs.")
                .option ("maxRedirect", "integer", "The maximum number of redirections.", 20)
                .option ("body", "any", "The request body.")
                .option ("verbose", "boolean", "Return the response object.")
            ;
        })
        .onRun (async ({ input }) =>
        {
            let options = nit.assign (input.toPojo (), { headers: nit.parseKvp (this.headers, ":") });
            let res = await http.fetch (options);

            res.body = await (res.isJson ? res.json () : res.binary ());

            return input.verbose
                ?  nit.pick (res, "statusCode", "statusMessage", "headers", "body")
                : res.body;
        })
    ;
};
