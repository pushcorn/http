module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("http.Etag"))
        .use ("nit.utils.Crypto")
        .constant ("EMPTY", '"47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU-0"')

        // copied from https://github.com/jshttp/etag/blob/master/index.js
        .staticMethod ("forStat", function (stat)
        {
            let time = stat.mtime.getTime ().toString (16);
            let size = stat.size.toString (16);

            return `W/"${time}-${size}"`;
        })
        .staticMethod ("forData", function (data)
        {
            if (nit.is.undef (data))
            {
                data = "";
            }

            if (!nit.is.buffer (data) && !nit.is.str (data))
            {
                data += "";
            }

            if (!data.length)
            {
                return Self.EMPTY;
            }

            let hash = Buffer.from (Self.Crypto.sha256 (data), "hex").toString ("base64url");

            return `"${hash}-${Buffer.byteLength (data).toString (32)}"`;
        })
        .staticMethod ("forFile", async function (path)
        {
            let file = nit.resolveAsset (path);

            if (!file)
            {
                nit.throw ("error.file_not_found", { path });
            }

            return Self.forStat (nit.fs.statSync (file));
        })
    ;
};
