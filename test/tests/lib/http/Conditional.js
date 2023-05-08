const Conditional = nit.require ("http.Conditional");


test.object (Conditional)
    .should ("be a class that uses the condition plugin")
    .expectingPropertyToBeOfType ("class.condition", "function")
    .expectingPropertyToBeOfType ("class.conditions", Array)
    .commit ()
;
