module.exports = function (nit)
{
    return nit.defineCommand ("http.commands.Server")
        .describe ("Run the web server.")
        .commandplugin ("http:server",
        {
            name: "nit http server",
            config:
            {
                "serverplugins": "http:auto-restart",
                "responsefilters":
                [
                    "http:etag-builder",
                    "http:cache-controller",
                    "http:css-compiler",
                    "http:body-compressor",
                    {
                        "@name": "http:view-renderer",
                        "conditions":
                        {
                            "@name": "http:response-content-type",
                            "types": ["text/css", "text/html"]
                        }
                    }
                ]
                ,
                "services":
                [
                    "http:socket-io",
                    "http:live-reload",
                    {
                        "@name": "http:file-server",
                        "template": true,
                        "extensions": [".html", ".css"],
                        "indexes": "index.html"
                    }
                ]
            }
        })
    ;
};
