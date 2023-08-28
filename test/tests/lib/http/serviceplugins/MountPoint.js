test.method ("http.serviceplugins.MountPoint", "preInit")
    .should ("add a RequestPathPrefix condition to the service")
    .up (s => s.createArgs = "/api")
    .before (s =>
    {
        const MyServ = s.Service.defineSubclass ("MyServ");

        s.args = new MyServ;
    })
    .expectingPropertyToBe ("args.0.constructor.conditions.length", 1)
    .expectingPropertyToBeOfType ("args.0.constructor.conditions.0", "http.conditions.RequestPathPrefix")
    .commit ()
;


test.method ("http.serviceplugins.MountPoint", "preDispatch")
    .should ("strip the path prefix")
    .up (s => s.createArgs = "/api")
    .before (s =>
    {
        s.args = [null, s.context = s.Context.new ("GET", "/api/users")];
    })
    .expectingPropertyToBe ("context.path", "/users")
    .commit ()
;


test.method ("http.serviceplugins.MountPoint", "postDispatch")
    .should ("restore the old path")
    .up (s => s.createArgs = "/api")
    .before (s =>
    {
        s.object.preDispatch (null, s.context = s.Context.new ("GET", "/api/users"));

        s.args = [null, s.context];
    })
    .expectingPropertyToBe ("context.path", "/api/users")
    .commit ()
;
