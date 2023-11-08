module.exports = function (nit, http)
{
    return http.defineTask ("Fetch")
        .describe ("Fetch the content from the given URL.")
        .use ("http.MimeType")
        .field ("<url>", "string", "The request URL.")
        .field ("auth", "string?", "Basic authentication ('user:password') to compute an Authorization header.")
        .field ("headers...", "string", "The request headers.")
        .field ("method", "string", "A string specifying the HTTP request method.", "GET")
            .constraint ("choice", "GET", "PUT", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS")
        .field ("timeout", "integer?", "A number specifying the socket timeout in milliseconds. This will set the timeout before the socket is connected.")
        .field ("rejectUnauthorized", "boolean?", "Whether to reject connections with unverified certs.")
        .field ("maxRedirect", "integer", "The maximum number of redirections.", 20)
        .field ("body", "any", "The request body.")
        .memo ("headerMap", function ()
        {
            let o = {};

            this.headers.forEach (h =>
            {
                let [k, v] = nit.kvSplit (h, ":");

                o[k.trim ()] = v.trim ();
            });

            return o;
        })
        .onRun (async function ()
        {
            let self = this;
            let options = nit.assign (self.toPojo (), { headers: self.headerMap });
            let res = await http.fetch (options);

            if (res.isJson)
            {
                return await res.json ();
            }
            else
            {
                return await res.binary ();
            }
        })
    ;
};
