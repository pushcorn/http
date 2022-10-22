module.exports = function (nit, http)
{
    return http.defineResponse ("FileReturned")
        .info (200, "The file has been returned.")
        .field ("<path>", "file", "The file path.",
            {
                setter: function (v)
                {
                    return nit.resolveAsset (v);
                }
            })
            .constraint ("asset-path")

        .method ("toBody", function ()
        {
            return nit.fs.createReadStream (this.path);
        })
    ;
};
