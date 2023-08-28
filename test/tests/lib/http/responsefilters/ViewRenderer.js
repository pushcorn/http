const Context = nit.require ("http.Context");


test.method ("http.responsefilters.ViewRenderer", "apply")
    .should ("render the template string if the content type matches")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseBody = "<{{data.name}}>";
            ctx.data = { name: "pushcorn" };
        }))
        .after (s => s.args[0].writeResponse ())
        .expectingPropertyToBe ("args.0.responseBody", "<pushcorn>")
        .commit ()

    .should ("render the template stream if the content type matches")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseBody = require ("stream").Readable.from (Buffer.from ("<{{data.name}}>"));
            ctx.data = { name: "test" };
        }))
        .after (s => s.args[0].writeResponse ())
        .expectingPropertyToBe ("args.0.responseBody", "<test>")
        .commit ()

    .should ("render the template buffer if the content type matches")
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.responseBody = Buffer.from ("<{{data.name}}>");
            ctx.data = { name: "test2" };
        }))
        .after (s => s.args[0].writeResponse ())
        .expectingPropertyToBe ("args.0.responseBody", "<test2>")
        .commit ()

    .should ("render the template into JSON if the client accepts application/vnd.nit.template+json")
        .up (s => s.createArgs = { property: "data" })
        .given (nit.do (Context.new (), ctx =>
        {
            ctx.req.headers = { accept: "application/vnd.nit.template+json" };
            ctx.responseHeader ("content-type", "text/html");
            ctx.responseBody = Buffer.from ("<{{name}}>");
            ctx.data = { name: "test2" };
        }))
        .after (s => s.args[0].writeResponse ())
        .expectingPropertyToBe ("args.0.responseHeaders.X-Response-Name", undefined)
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", /^"[a-z0-9_-]+,[a-z0-9_-]+"$/i)
        .expectingPropertyToBe ("args.0.responseBody", JSON.stringify ({ data: { name: "test2" }, template: "<{{name}}>" }))
        .commit ()
;
