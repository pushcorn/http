module.exports = function (nit, http)
{
    return http.defineResponse ("myapp.responses.HelloMessageReturned")
        .info (200, "The hello message has been returned.")
        .field ("<message>", "string")
    ;
};
