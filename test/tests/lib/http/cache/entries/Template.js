const Template = nit.require ("http.cache.entries.Template");
const httpContext = nit.require ("http.Context");


test.method ("http.cache.entries.Template", "buildValue",
    {
        createArgs: ["resources/html/page-one.html"]
    })
    .should ("render the template file recursively")
    .before (async function ()
    {
        this.object.tags = await this.object.buildTags (this.args[0]);
    })
    .given (new Template.Context (
    {
        httpContext: httpContext.create ("GET", "/"),
        cache: nit.new ("nit.Cache", "http.cache.entries.Template"),
        transforms:
        {
            include: async function (file)
            {
                return await this.cache.fetch (file, this);
            }
        }
    }))
    .spy ("object", "addDependency")
    .spy ("args.0.httpContext", "responseHeader")
    .returns (`This is page one.
This is page two!

`)
    .expectingPropertyToBe ("spies.0.invocations.length", 1)
    .expectingPropertyToBe ("spies.1.invocations.length", 4)
    .expectingPropertyToBe ("args.0.httpContext.responseHeaders.Last-Modified", /^2022/)
    .commit ()
;
