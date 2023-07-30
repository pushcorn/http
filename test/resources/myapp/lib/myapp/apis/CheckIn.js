module.exports = function (nit, http)
{
    return http.defineApi ("myapp.apis.CheckIn")
        .info ("Check-in your location.")
        .endpoint ("POST", "/check-ins")
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
                .form ("<location>", Request.Location.name)
            ;
        })
    ;
};