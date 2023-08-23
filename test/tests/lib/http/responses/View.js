test.method ("http.responses.View", "hash", true)
    .should ("return the sha256 checksum for the given data")
        .given ("test")
        .returns ("n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg")
        .commit ()
;


test.method ("http.responses.View", "toBody")
    .should ("throw if the template file was not found")
        .up (s => s.createArgs = "page-one.html")
        .before (s => s.args = s.http.Context.new ())
        .throws ("error.template_not_found")
        .commit ()

    .should ("render the template with the given data")
        .up (s =>
        {
            s.createArgs = "page-one.html";
            s.args = nit.assign (s.http.Context.new (),
            {
                service: s.createService (
                {
                    assetResolvers: { roots: "resources/html" },
                    templateLoaders: { extensions: ".html" }
                })
            });
        })
        .returns (nit.trim.text`
            This is page one.
            This is page two!
        ` + "\n\n")
        .commit ()

    .should ("use the given content type")
        .up (s =>
        {
            s.createArgs = { template: "page-one.html", contentType: "text/csv" };
            s.args = nit.assign (s.http.Context.new (),
            {
                service: s.createService (
                {
                    assetResolvers: { roots: "resources/html" },
                    templateLoaders: { extensions: ".html" }
                })
            });
        })
        .returns (nit.trim.text`
            This is page one.
            This is page two!
        ` + "\n\n")
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/csv")
        .commit ()

    .should ("accept a template string")
        .up (s =>
        {
            s.createArgs =
            {
                template: nit.trim.text`
                First Name: {{firstname}}
                Last Name: {{lastname}}
                `,
                data:
                {
                    firstname: "John",
                    lastname: "Doe"
                }
            };

            s.args = s.http.Context.new ();
        })
        .returns (nit.trim.text`
            First Name: John
            Last Name: Doe
        `)
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/html")
        .commit ()

    .should ("accept a template object")
        .up (s =>
        {
            s.createArgs =
            {
                template: nit.Template (nit.trim.text`
                    First Name: {{firstname}}
                    Last Name: {{lastname}}
                `)
                ,
                data:
                {
                    firstname: "John",
                    lastname: "Doe"
                }
            };

            s.args = s.http.Context.new ();
        })
        .returns (nit.trim.text`
            First Name: John
            Last Name: Doe
        `)
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "text/html")
        .commit ()

    .should ("return the template and data in JSON if the client accepts only application/vnd.nit.template+json")
        .up (s =>
        {
            s.createArgs = ["page-one.html", nit.o ({ a: 1 })];
            s.args = s.ctx = nit.assign (s.http.Context.new (),
            {
                service: s.createService (
                {
                    assetResolvers: { roots: "resources/html" },
                    templateLoaders: { extensions: ".html" }
                })
            });

            s.ctx.req.headers.accept = "application/vnd.nit.template+json";
        })
        .returns (nit.toJson (
        {
            data: { a: 1 },
            template: nit.trim.text`
                This is page one.
                This is page two!
            ` + "\n\n"
        }))
        .expectingPropertyToBe ("args.0.responseHeaders.Content-Type", "application/vnd.nit.template+json")
        .expectingPropertyToBe ("args.0.responseHeaders.ETag", /^".*,.*"$/)
        .commit ()
;
