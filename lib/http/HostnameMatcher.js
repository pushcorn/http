module.exports = function (nit)
{
    return nit.defineClass ("http.HostnameMatcher")
        .field ("<name>", "string", "The hostname pattern.")
        .property ("priority", "integer") // 0-4: 0 means no match
        .property ("pattern", "RegExp")
        .construct (function (name)
        {
            if (name == "*")
            {
                this.pattern = /.*/;
                this.priority = 1;
            }
            else
            if (~name.indexOf ("*"))
            {
                this.pattern = new RegExp ("^" + name.replace (/\./g, "[.]").replace (/\*/g, "[^.]+") + "$", "i");
                this.priority = 2;
            }
            else
            if (name[0] == "~")
            {
                this.pattern = nit.parseRegExp (name.slice (1));
                this.priority = 3;
            }
            else
            {
                this.pattern = new RegExp ("^" + nit.escapeRegExp (name) + "$", "i");
                this.priority = 4;
            }
        })
        .method ("matches", function (hostname)
        {
            return hostname.match (this.pattern) ? this.priority : 0;
        })
    ;
};
