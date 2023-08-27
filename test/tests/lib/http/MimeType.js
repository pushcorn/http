const MimeType = nit.require ("http.MimeType");


test.object (MimeType)
    .should ("have a static property MIME_TYPES that contains a list of known mime types")
    .expectingPropertyToBeOfType ("class.MIME_TYPES", "Object")
    .expectingPropertyToBe ("class.MIME_TYPES.json.name", "application/json")
    .commit ()
;


test.method (MimeType, "lookup", true)
    .should ("return the mime type info for the specified name")
        .given ("text/html")
        .returnsInstanceOf (MimeType)
        .expectingPropertyToBe ("result.name", "text/html")
        .expectingPropertyToBe ("result.extensions", ["html", "htm", "shtml"])
        .expectingPropertyToBe ("result.compressible", true)
        .commit ()

    .given ("text/abc")
        .returns ()
        .commit ()

    .should ("return the mime type info for the specified extension")
        .given ("json")
        .returnsInstanceOf (MimeType)
        .expectingPropertyToBe ("result.name", "application/json")
        .expectingPropertyToBe ("result.extensions", ["json", "map"])
        .expectingPropertyToBe ("result.compressible", true)
        .commit ()

;


test.method (MimeType, "lookupName", true)
    .should ("return the mime type's name")
        .given ("text/html")
        .returns ("text/html")
        .commit ()

    .reset ()
        .given (".html")
        .returns ("text/html")
        .commit ()
;
