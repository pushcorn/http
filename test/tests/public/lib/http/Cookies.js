/**
 * @jest-environment jsdom
 */


nit.test.Strategy
    .memo ("document", () => global.document)
;


test.method ("http.Cookies", "get", true)
    .should ("return the value of a cookie")
        .given ("akey")
        .returns ()
        .commit ()

    .reset ()
        .before (s =>
        {
            s.document.cookie = ["akey", "a test value"].map (encodeURIComponent).join ("=");
        })
        .given ("akey")
        .returns ("a test value")
        .commit ()

    .should ("return all values if no key were specified")
        .given ()
        .returns ({ akey: "a test value" })
        .after (s => s.class.set ("akey", null))
        .commit ()
;


test.method ("http.Cookies", "set", true)
    .should ("save a cookie")
        .given ("k1", 1234)
        .expectingPropertyToBe ("document.cookie", "k1=1234")
        .expecting ("cookie k1 is %{value}", 1234, s => s.class.get ("k1"))
        .commit ()

    .should ("serialize an object to JSON")
        .given ("k2", { a: "value a", b: 54321 })
        .expecting ("cookie k2 is %{value}", { a: "value a", b: 54321 }, s => s.class.get ("k2"))
        .commit ()

    .should ("serialize an array to JSON")
        .given ("k3", [123, true, "str"])
        .expecting ("cookie k3 is %{value}", [123, true, "str"], s => s.class.get ("k3"))
        .expectingPropertyToBe ("document.cookie", "k1=1234; k2=%7B%22a%22%3A%22value%20a%22%2C%22b%22%3A54321%7D; k3=%5B123%2Ctrue%2C%22str%22%5D")
        .commit ()

    .should ("clear the cookie if the value is null or undefined")
        .given ("k3")
        .expecting ("cookie k3 is %{value}", undefined, s => s.class.get ("k3"))
        .commit ()

    .should ("parse the expires string to a date")
        .given ("k3", "with exp", new Date (Date.now () + 1000 * 60 * 60 *24).toISOString (), "pushcorn.com", "/p", true)
        .before (s =>
        {
            let prop = nit.propertyDescriptors (global.document, true).cookie;
            let set = prop.set;

            prop.set = function (v)
            {
                s.cookie = v;
                set.apply (this, arguments);
            };

            nit.dp (global.document, "cookie", prop);
        })
        .expectingPropertyToBe ("document.cookie", "k1=1234; k2=%7B%22a%22%3A%22value%20a%22%2C%22b%22%3A54321%7D")
        .expectingPropertyToBe ("cookie", /^k3=with%20exp; expires=\w{3}, \d+ \w{3} \d{4,} \d{2}:\d{2}:\d{2} GMT; path=\/p; domain=pushcorn.com; secure$/)
        .commit ()
;
