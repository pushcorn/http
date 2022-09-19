module.exports = function (nit, http, Self)
{
    return (Self = nit.defineClass ("http.PathParser"))
        .constant ("SEGMENT_PATTERN", /(\/:?[\w-_*]+)/g)
        .m ("error.duplicate_param_name", "The parameter '%{param}' cannot be redefined.")
        .field ("<path>", "string", "The path expression.")
        .property ("pattern", "RegExp") // The parsed path expression.
        .property ("params...", "string") // The parameter names.
        .property ("segments...", "string") // The path segments.

        .construct (function (path)
        {
            let self = this;
            let lastPos = 0;
            let pattern = "";

            function addParam (param)
            {
                if (self.params.includes (param))
                {
                    self.throw ("error.duplicate_param_name", { param });
                }

                self.params.push (param);
            }

            path.replace (Self.SEGMENT_PATTERN, function (_, s, pos)
            {
                self.segments.push (s.slice (1));

                pattern += nit.escapeRegExp (path.slice (lastPos, pos));

                lastPos = pos + s.length;

                if (s[1] == ":")
                {
                    addParam (s.slice (2));

                    s = nit.escapeRegExp ("/") + "([^/]+)";
                }
                else
                if (s[1] == "*")
                {
                    addParam ("*");

                    s = nit.escapeRegExp ("/") + "(.*)";
                }
                else
                {
                    s = nit.escapeRegExp (s);
                }

                pattern += s;
            });

            pattern += nit.escapeRegExp (path.slice (lastPos));

            self.pattern = new RegExp ("^" + pattern + "$", "i");
        })

        .method ("parse", function (path)
        {
            let params  = {};
            let match;

            if ((match = path.match (this.pattern)))
            {
                for (let x = 1, y = match.length; x < y; ++x)
                {
                    params[this.params[x - 1]] = match[x];
                }

                return params;
            }
        })
        .method ("build", function (params)
        {
            return "/" + this.segments
                .map (function (s)
                {
                    if (s[0] == ":")
                    {
                        let n = s.slice (1);

                        return n in params ? params[n] : n;
                    }
                    else
                    if (s == "*")
                    {
                        return s in params ? params[s] : undefined;
                    }
                    else
                    {
                        return s;
                    }
                })
                .filter (s => !nit.is.undef (s))
                .join ("/")
            ;
        })
    ;
};
