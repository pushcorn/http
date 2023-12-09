test.object ("http.ApiSpec")
    .should ("create a spec from an API")
    .project ("myapp", true)
    .up (s =>
    {
        s.args = { apis: nit.listComponents ("apis").map (c => new c.class) };
    })
    .after (s => s.result.sort ())
    .expectingPropertyJsonToBe ("result", __filename)
    .commit ()
;


test.method ("http.ApiSpec.Constraint", "nit.Object.caster", true)
    .should ("skip if the input is not an instance of nit.Constraint")
        .given (3)
        .returns (3)
        .commit ()

    .should ("set the constraint name if specified")
        .given (nit.new ("constraints.Custom", nit.noop, { name: "test:noop" }))
        .returnsInstanceOf ("http.ApiSpec.Constraint")
        .expectingPropertyToBe ("result.name", "test:noop")
        .commit ()
;


test.method ("http.ApiSpec.Parameter", "nit.Object.caster", true)
    .should ("skip if the input is not an instance of http.Api.Request.Parameter")
        .given (3)
        .returns (3)
        .commit ()
;


test.method ("http.ApiSpec.Field", "nit.Object.caster", true)
    .should ("skip if the input is not an instance of nit.Field")
        .given (3)
        .returns (3)
        .commit ()
;
