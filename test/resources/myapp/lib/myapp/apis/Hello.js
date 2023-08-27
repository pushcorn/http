module.exports = function (nit, http)
{
    return http.defineApi ("myapp.apis.Hello")
        .info ("Say Hello!")
        .endpoint ("GET", "/hello")
        .defineRequest (Request =>
        {
            Request
                .query ("<name>", "string", "The person's name.")
                .query ("[title]", "string", "The person's title.")
                .parameter ("opt1", "string")
                    .constraint ("choice", "val1", "val2")
                .parameter ("opt2", "string")
                    .constraint ("myapp:unique")
                .parameter ("opt3", "string")
                    .constraint ("myapp:email")
                .parameter ("opt4", "string")
                    .constraint ("choice", "val4-1", "val4-2",
                    {
                        condition: "nit.is.not.empty (opt2)"
                    })
                .parameter ("opt5", "integer")
            ;
        })
        .response ("myapp:HelloMessageReturned", "http:ValidationFailed")

        .onRun (ctx =>
        {
            let { name, title } = ctx.request;

            ctx.send (`Hello ${title ? title + " " : ""}${name}!`);
        })
    ;
};
