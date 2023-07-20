module.exports = function (nit, http, Self)
{
    var writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("http.PathParser"))
        .constant ("SEGMENT_PATTERN", /^\/:?[\w-_*]+/)
        .m ("error.duplicate_param_name", "The parameter '%{param}' cannot be redefined.")
        .field ("<path>", "string", "The path expression.")
        .property ("pattern", "RegExp", { writer: writer }) // The parsed path expression.
        .property ("params...", "string", { writer: writer }) // The parameter names.
        .property ("segments...", "string", { writer: writer }) // The path segments.
        .property ("rest", "string", { writer: writer }) // The path segments.

        .onConstruct (function (path)
        {
            var self = this;
            var lastPos = 0;
            var pattern = "";

            function addParam (param)
            {
                if (~self.params.indexOf (param))
                {
                    self.throw ("error.duplicate_param_name", { param: param });
                }

                self.params.push (param);
            }

            var p = path;
            var m, len, seg;

            while ((m = p.match (Self.SEGMENT_PATTERN)))
            {
                m = m[0];
                len = m.length;
                seg = p.slice (0, len);
                self.segments.push (seg.slice (1));

                if (seg[1] == ":")
                {
                    addParam (seg.slice (2));

                    pattern += nit.escapeRegExp ("/") + "([^/?=]+)";
                }
                else
                if (seg[1] == "*")
                {
                    addParam ("*");

                    pattern += nit.escapeRegExp ("/") + "(.*)";
                }
                else
                {
                    pattern += nit.escapeRegExp (seg);
                }

                p = p.slice (len);
                lastPos += len;
            }

            self.rest = writer.value (path.slice (lastPos));
            self.pattern = writer.value (new RegExp ("^" + pattern, "i"));
        })

        .method ("parse", function (path)
        {
            var params  = {};
            var match;

            if ((match = path.match (this.pattern)))
            {
                for (var x = 1, y = match.length; x < y; ++x)
                {
                    params[this.params[x - 1]] = match[x];
                }

                return params;
            }
        })
        .method ("build", function (params)
        {
            var self = this;

            return (self.segments.length ? "/" : "")
                + self.segments
                    .map (function (s)
                    {
                        if (s[0] == ":")
                        {
                            var n = s.slice (1);

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
                    .filter (nit.is.not.undef)
                    .join ("/")
                + self.rest
            ;
        })
    ;
};
