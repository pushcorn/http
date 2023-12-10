test.method ("http.mocks.Socket", "on")
    .should ("register the event listener")
    .given ("connect", nit.noop)
    .returnsInstanceOf ("http.mocks.Socket")
    .expectingPropertyToBe ("object.listeners.connect", () => nit.noop)
    .commit ()
;


test.method ("http.mocks.Socket", "setKeepAlive")
    .should ("set the keepAlive field")
    .given (true)
    .returnsInstanceOf ("http.mocks.Socket")
    .expectingPropertyToBe ("object.keepAlive", true)
    .commit ()
;


test.method ("http.mocks.Socket", "setTimeout")
    .should ("set the timeout value")
    .given (1000)
    .returnsInstanceOf ("http.mocks.Socket")
    .expectingPropertyToBe ("object.timeout", 1000)
    .commit ()
;


test.method ("http.mocks.Socket", "end")
    .should ("end the socket and invoke the callback if available")
    .given (function cb () { cb.called = true; })
    .before (s =>
    {
        s.object.on ("end", nit.noop);
        s.object.on ("close", nit.noop);

        s.obj = s.object;
    })
    .spy ("obj.listeners", "end")
    .spy ("obj.listeners", "close")
    .returnsInstanceOf ("http.mocks.Socket")
    .expectingPropertyToBe ("object.ended", true)
    .expectingPropertyToBe ("args.0.called", true)
    .expectingPropertyToBe ("spies.0.invocations.length", 1)
    .expectingPropertyToBe ("spies.1.invocations.length", 1)
    .commit ()
;
