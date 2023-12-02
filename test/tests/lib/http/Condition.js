test.plugin ("http.Condition", "applicableTo", { registerPlugin: true })
    .should ("return true if the every condition passed the check")
        .before (s => s.TrueCondition = s.pluginClass.defineSubclass ("test.conditions.TrueCondition")
            .onCheck (() => s.checked = true)
        )
        .before (s => s.hostClass.condition ("test:true-condition"))
        .returns (true)
        .expectingPropertyToBe ("checked", true)
        .commit ()

    .should ("return false if the some condition failed")
        .before (s => s.FalseCondition = s.pluginClass.defineSubclass ("test.conditions.FalseCondition")
            .onCheck (() => s.checked = false)
        )
        .before (s => s.hostClass.condition ("test:false-condition"))
        .returns (false)
        .expectingPropertyToBe ("checked", false)
        .commit ()

    .should ("check the instance conditions")
        .init (s => s.instancePluginAllowed = true)
        .before (s => s.FalseCondition = s.pluginClass.defineSubclass ("test.conditions.InstCondition")
            .onCheck (() => s.checked = true)
        )
        .before (s => s.hostClass.condition.call (s.host, "test:inst-condition"))
        .returns (true)
        .expectingPropertyToBe ("checked", true)
        .expectingPropertyToBe ("host.conditions.length", 1)
        .commit ()
;
