test.method ("http.plugins.AssetResolver", "onUsePlugin", true)
    .should ("add resolver methods to the host class")
    .up (s => s.hostClass = s.http
        .defineConditional ("http.services.MyService")
        .defineInstanceDescriptor ()
    )
    .up (s => s.args = s.hostClass)
    .after (s => s.service = s.hostClass.Descriptor.build (
    {
        assetResolvers: { roots: "public" }
    }))
    .expectingPropertyToBe ("hostClass.fieldMap.assetResolvers.array", true)
    .expectingPropertyToBe ("hostClass.fieldMap.assetResolvers.type", "http.AssetResolver")
    .expectingPropertyToBe ("service.assetResolvers.length", 1)
    .expectingMethodToReturnValue ("service.resolveAsset", "index.html", nit.path.join (test.TEST_PROJECT_PATH, "../public/index.html"))
    .expectingMethodToReturnValue ("service.resolveAsset", "index2.html", undefined)
    .commit ()
;
