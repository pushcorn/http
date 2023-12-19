module.exports = function (nit, http)
{
    return http.defineApi ("myapp.apis.CheckIn")
        .describe ("Check-in your location.")
        .endpoint ("POST", "/check-ins")
        .response ("myapp:CheckInRecorded")
        .defineRequest (Request =>
        {
            Request
                .defineInnerClass ("Location", Location =>
                {
                    Location
                        .field ("<latitude>", "number")
                        .field ("<longitude>", "number")
                    ;
                })
                .form ("<userId>", "string")
                .parameter ("<location>", Request.Location.name)
            ;
        })
        .onRun (ctx =>
        {
            ctx.respond ();
        })
    ;
};
