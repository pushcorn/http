module.exports = function (nit)
{
    return nit.defineClass ("http.MimeTypeMatcher")
        .field ("<type>", "string", "The mime type.")
        .property ("pattern", "RegExp")
        .construct (function (type)
        {
            type = type.replace (/\*\+/g, "@any_plus@")
              .replace (/\*/g, "@any@")
              .replace (/([./+])/g, "\\$1")
              .replace (/@any_plus@/g, "(.*\\+|)")
              .replace (/@any@/g, ".*")
            ;

            this.pattern = new RegExp ("^" + type + "$", "i");
        })
        .method ("matches", function (type)
        {
            return this.pattern.test (type);
        })
    ;
};
