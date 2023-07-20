module.exports = function (nit, global, Self)
{
    return (Self = nit.defineClass ("http.Cookies"))
        .constant ("COOKIE_SEPARATOR", /;\s?/)

        .staticMethod ("get", function (key)
        {
            var cookies = global.document.cookie;
            var values = {};

            nit.each (cookies ? cookies.split (Self.COOKIE_SEPARATOR) : [], function (cookie)
            {
                cookie = cookie.split ("=").map (decodeURIComponent);

                values[cookie[0]] = nit.toVal (cookie[1]);
            });

            return key ? values[key] : values;
        })
        .staticMethod ("set", function (key, value, expires, domain, path, secure) // eslint-disable-line no-unused-vars
        {
            var cfg = nit.typedArgsToObj (nit.array (arguments).slice (2),
            {
                expires: ["integer", "string", "Date"], // days if integer
                domain: "string",
                path: "string",
                secure: "boolean"
            });

            expires = cfg.expires;

            if (nit.is.undef (value))
            {
                value = "";
                expires = -1;
            }

            if (typeof value == "object")
            {
                value = nit.toJson (value);
            }

            if (nit.is.int (expires))
            {
                var d = new Date ();

                d.setDate (d.getDate () + expires);

                expires = d;
            }
            else
            if (nit.is.str (expires))
            {
                expires = nit.parseDate (expires);
            }

            global.document.cookie =
            [
                [key, value].map (function (s) { return encodeURIComponent (nit.trim (s)); }).join ("="),
                expires ? "; expires=" + expires.toUTCString () : "",
                cfg.path ? "; path=" + cfg.path : "",
                cfg.domain ? "; domain=" + cfg.domain : "",
                cfg.secure  ? "; secure" : ""
            ]
            .join ("");
        })
    ;
};
