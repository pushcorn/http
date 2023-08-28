module.exports = function (nit, http, Self)
{
    return (Self = http.defineResponse ("http.responses.View"))
        .m ("error.template_not_found", "The template file '%{file}' was not found.")
        .info (200, "OK")
        .use ("http.MimeType")
        .use ("nit.utils.Crypto")
        .constant ("TEMPLATE_MIME_TYPE", "application/vnd.nit.template+json")

        .field ("<template>", "any", "The view template.")
            .constraint ("type", "string", "nit.Template")
        .field ("[data]", "object", "The data to be rendered.")
        .field ("[contentType]", "string", "The content type.")
        .field ("openTag", "string", "The template open tag.", "{{")
        .field ("closeTag", "string", "The template close tag.", "}}")

        .staticMethod ("hash", function (data)
        {
            return Buffer.from (Self.Crypto.sha256 (data), "hex").toString ("base64url");
        })
        .method ("toBody", async function (ctx)
        {
            let self = this;
            let { template, data, contentType, openTag, closeTag } = self;
            let file;

            if (nit.is.str (template)
                && !template.includes (openTag)
                && !template.includes (closeTag))
            {
                if ((file = await ctx.resolveAsset (template)))
                {
                    template = await ctx.loadTemplate ("file://" + file);
                }
                else
                {
                    self.throw ("error.template_not_found", { file: template });
                }
            }

            if (!(template instanceof nit.Template))
            {
                template = new nit.Template (template, openTag, closeTag);
            }

            contentType = contentType
                || ctx.responseHeader ("Content-Type")
                || (file && Self.MimeType.lookupName (nit.path.extname (file)))
                || "text/html"
            ;

            ctx.vary ("Accept");

            let reqType = ctx.acceptsType ([contentType, Self.TEMPLATE_MIME_TYPE]);

            if (reqType == Self.TEMPLATE_MIME_TYPE)
            {
                ctx.responseHeader ("Content-Type", Self.TEMPLATE_MIME_TYPE);
                ctx.responseHeader ("ETag",
                    '"' +
                    [nit.toJson (data), template.template].map (Self.hash).join (",") +
                    '"'
                );

                return nit.toJson ({ data, template: template.template });
            }
            else
            {
                ctx.responseHeader ("Content-Type", contentType);

                return template.render (data);
            }
        })
    ;
};
