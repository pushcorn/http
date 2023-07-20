module.exports = function (nit)
{
    return nit.defineClass ("http.mocks.XmlHttpRequest")
        .do (c => global.XMLHttpRequest = c)
        .field ("method", "string")
        .field ("url", "string")
        .field ("requestHeaders", "object")
        .field ("responseHeaders", "object")
        .field ("responseText", "string")
        .field ("response", "any")
        .field ("onload", "function")
        .field ("onabort", "function")
        .field ("onerror", "function")
        .field ("ontimeout", "function")
        .field ("onsend", "function")
        .field ("data", "any")
        .field ("timeout", "integer")
        .field ("status", "integer")
        .field ("statusText", "string")

        .method ("getAllResponseHeaders", function ()
        {
            return nit.each (this.responseHeaders, (v, k) => `${k}: ${v}`, true)
                .join ("\r\n")
            ;
        })
        .method ("open", function (method, url)
        {
            this.method = method;
            this.url = url;
        })
        .method ("setRequestHeader", function (header, value)
        {
            this.requestHeaders[header] = value;
        })
        .lifecycleMethod ("send", async function (data)
        {
            let self = this;
            let cls = this.constructor;

            self.data = data;
            self.response = await cls[cls.kSend]?.call (self, data);

            return self.onload?. ();
        })
    ;
};
