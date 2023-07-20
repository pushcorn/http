test.object ("http.ServicePlugin")
    .should ("define service lifecycle methods")
    .expectingPropertyToBeOfType ("class.prototype.preInit", "function")
    .expectingPropertyToBeOfType ("class.prototype.postInit", "function")
    .expectingPropertyToBeOfType ("class.prototype.preStart", "function")
    .expectingPropertyToBeOfType ("class.prototype.postStart", "function")
    .expectingPropertyToBeOfType ("class.prototype.preStop", "function")
    .expectingPropertyToBeOfType ("class.prototype.postStop", "function")
    .expectingPropertyToBeOfType ("class.prototype.preUpgrade", "function")
    .expectingPropertyToBeOfType ("class.prototype.postUpgrade", "function")
    .expectingPropertyToBeOfType ("class.prototype.preDispatch", "function")
    .expectingPropertyToBeOfType ("class.prototype.postDispatch", "function")
    .commit ()
;



