const Context = nit.require ("http.Context");


test.method ("http.services.ApiServer", "init")
    .should ("exclude the specified apis")
        .project ("myapp")
        .up (s =>
        {
            s.createArgs =
            {
                excludes: "myapp.apis.Hello",
                includes: ["myapp.*", "http.*"]
            };
        })
        .expectingPropertyToBe ("result.handlers.length", 3)
        .commit ()

    .should ("include only the specified apis")
        .project ("myapp")
        .up (s =>
        {
            s.createArgs =
            {
                includes: "http.*"
            };
        })
        .expectingPropertyToBe ("result.handlers.length", 1)
        .commit ()
;


test.method ("http.services.ApiServer", "dispatch")
    .should ("return the API spec if the path is the API root")
        .project ("myapp")
        .up (s =>
        {
            s.createArgs =
            {
                includes: ["myapp.*", "http.*"]
            };
        })
        .given (Context.new ("GET", "/api"))
        .before (async (s) =>
        {
            s.class.serviceplugin ("http:mount-point", "/api");

            await s.object.init ();
        })
        .after (s => s.responseJson = nit.toJson (s.args[0].response.toPojo (), "  "))
        .expectingPropertyToBeOfType ("args.0.response", "http.responses.ApiSpecReturned")
        .expectingPropertyToBe ("responseJson", nit.trim.text`
        {
          "spec": {
            "apis": [
              {
                "name": "CheckIn",
                "method": "POST",
                "path": "/check-ins",
                "description": "Check-in your location.",
                "request": {
                  "parameters": [
                    {
                      "spec": "<userId>",
                      "type": "string",
                      "source": "form"
                    },
                    {
                      "spec": "<location>",
                      "type": "Location",
                      "source": "form"
                    }
                  ]
                },
                "responses": [
                  "CheckInRecorded",
                  "ValidationFailed"
                ]
              },
              {
                "name": "GetApiSpec",
                "method": "GET",
                "path": "/",
                "description": "Get the API specification.",
                "responses": [
                  "ApiSpecReturned"
                ]
              },
              {
                "name": "GetBlob",
                "method": "POST",
                "path": "/blobs",
                "description": "Get the blob!",
                "request": {
                  "parameters": [
                    {
                      "spec": "[content]",
                      "type": "string",
                      "description": "The blob content."
                    }
                  ]
                },
                "responses": [
                  "BlobReturned",
                  "ValidationFailed"
                ]
              },
              {
                "name": "Hello",
                "method": "GET",
                "path": "/hello",
                "description": "Say Hello!",
                "request": {
                  "parameters": [
                    {
                      "spec": "<name>",
                      "type": "string",
                      "description": "The person's name.",
                      "source": "query"
                    },
                    {
                      "spec": "[title]",
                      "type": "string",
                      "description": "The person's title.",
                      "source": "query"
                    },
                    {
                      "spec": "opt1",
                      "type": "string",
                      "constraints": [
                        {
                          "type": "choice",
                          "code": "error.invalid_choice",
                          "message": "The %{property.kind} '%{property.name}' is assigned to an invalid value '%{value}'. (Allowed: %{constraint.choiceValues.join (', ')})",
                          "options": {
                            "choices": [
                              "val1",
                              "val2"
                            ]
                          }
                        }
                      ]
                    },
                    {
                      "spec": "opt2",
                      "type": "string",
                      "constraints": [
                        {
                          "type": "myapp:unique",
                          "code": "error.not_unique",
                          "message": "The valid '%{value}' is not unique."
                        }
                      ]
                    },
                    {
                      "spec": "opt3",
                      "type": "string",
                      "constraints": [
                        {
                          "type": "myapp:email",
                          "code": "error.invalid_email_format",
                          "message": "The email address '%{value}' is invalid."
                        }
                      ]
                    },
                    {
                      "spec": "opt4",
                      "type": "string",
                      "constraints": [
                        {
                          "type": "choice",
                          "code": "error.invalid_choice",
                          "message": "The %{property.kind} '%{property.name}' is assigned to an invalid value '%{value}'. (Allowed: %{constraint.choiceValues.join (', ')})",
                          "condition": "nit.is.not.empty (opt2)",
                          "options": {
                            "choices": [
                              "val4-1",
                              "val4-2"
                            ]
                          }
                        }
                      ]
                    },
                    {
                      "spec": "opt5",
                      "type": "integer"
                    },
                    {
                      "spec": "opt6...",
                      "type": "string*"
                    }
                  ]
                },
                "responses": [
                  "HelloMessageReturned",
                  "ValidationFailed"
                ]
              }
            ],
            "responses": [
              {
                "name": "ApiSpecReturned",
                "status": 200,
                "message": "The API spec has been returned.",
                "fields": [
                  {
                    "spec": "<spec>",
                    "type": "ApiSpec"
                  }
                ]
              },
              {
                "name": "BlobReturned",
                "status": 200,
                "message": "The blob has been returned.",
                "fields": [
                  {
                    "spec": "<content>",
                    "type": "string"
                  }
                ]
              },
              {
                "name": "CheckInRecorded",
                "status": 201,
                "message": "The check-in info has been recorded."
              },
              {
                "name": "HelloMessageReturned",
                "status": 200,
                "message": "The hello message has been returned.",
                "fields": [
                  {
                    "spec": "<message>",
                    "type": "string"
                  }
                ]
              },
              {
                "name": "ValidationFailed",
                "status": 400,
                "message": "One or more parameters are invalid.",
                "code": "error.model_validation_failed",
                "fields": [
                  {
                    "spec": "<violations...>",
                    "type": "Violation",
                    "description": "The validation violations."
                  }
                ]
              }
            ],
            "models": [
              {
                "name": "Api",
                "fields": [
                  {
                    "spec": "<name>",
                    "type": "string"
                  },
                  {
                    "spec": "[method]",
                    "type": "string?"
                  },
                  {
                    "spec": "[path]",
                    "type": "string?"
                  },
                  {
                    "spec": "[description]",
                    "type": "string?"
                  },
                  {
                    "spec": "request",
                    "type": "Request"
                  },
                  {
                    "spec": "responses...",
                    "type": "string?"
                  }
                ]
              },
              {
                "name": "ApiSpec",
                "fields": [
                  {
                    "spec": "apis...",
                    "type": "Api"
                  },
                  {
                    "spec": "responses...",
                    "type": "Response"
                  },
                  {
                    "spec": "models...",
                    "type": "Model"
                  }
                ]
              },
              {
                "name": "Constraint",
                "fields": [
                  {
                    "spec": "<type>",
                    "type": "string"
                  },
                  {
                    "spec": "[code]",
                    "type": "string"
                  },
                  {
                    "spec": "[message]",
                    "type": "string"
                  },
                  {
                    "spec": "name",
                    "type": "string?"
                  },
                  {
                    "spec": "condition",
                    "type": "string?"
                  },
                  {
                    "spec": "options",
                    "type": "object?"
                  }
                ]
              },
              {
                "name": "Field",
                "fields": [
                  {
                    "spec": "<spec>",
                    "type": "string"
                  },
                  {
                    "spec": "[type]",
                    "type": "string?"
                  },
                  {
                    "spec": "[description]",
                    "type": "string?"
                  },
                  {
                    "spec": "[defval]",
                    "type": "any"
                  },
                  {
                    "spec": "constraints...",
                    "type": "Constraint?"
                  }
                ]
              },
              {
                "name": "Location",
                "fields": [
                  {
                    "spec": "<latitude>",
                    "type": "number"
                  },
                  {
                    "spec": "<longitude>",
                    "type": "number"
                  }
                ]
              },
              {
                "name": "Model",
                "fields": [
                  {
                    "spec": "<name>",
                    "type": "string",
                    "description": "The model name."
                  },
                  {
                    "spec": "fields...",
                    "type": "Field?",
                    "description": "The model fields."
                  }
                ]
              },
              {
                "name": "Parameter",
                "fields": [
                  {
                    "spec": "<spec>",
                    "type": "string"
                  },
                  {
                    "spec": "[type]",
                    "type": "string?"
                  },
                  {
                    "spec": "[description]",
                    "type": "string?"
                  },
                  {
                    "spec": "[defval]",
                    "type": "any"
                  },
                  {
                    "spec": "label",
                    "type": "string?"
                  },
                  {
                    "spec": "source",
                    "type": "string?"
                  },
                  {
                    "spec": "constraints...",
                    "type": "Constraint?"
                  }
                ]
              },
              {
                "name": "Request",
                "fields": [
                  {
                    "spec": "parameters...",
                    "type": "Parameter?"
                  }
                ]
              },
              {
                "name": "Response",
                "fields": [
                  {
                    "spec": "<name>",
                    "type": "string",
                    "description": "The response name."
                  },
                  {
                    "spec": "<status>",
                    "type": "integer",
                    "description": "The response status code."
                  },
                  {
                    "spec": "[message]",
                    "type": "string?",
                    "description": "The response status message."
                  },
                  {
                    "spec": "[code]",
                    "type": "string?",
                    "description": "The error code that the response represents."
                  },
                  {
                    "spec": "fields...",
                    "type": "Field?",
                    "description": "The response fields."
                  }
                ]
              },
              {
                "name": "Violation",
                "fields": [
                  {
                    "spec": "field",
                    "type": "string",
                    "description": "The field that failed the validation."
                  },
                  {
                    "spec": "constraint",
                    "type": "string",
                    "description": "The constraint that caused error."
                  },
                  {
                    "spec": "code",
                    "type": "string",
                    "description": "The error code."
                  },
                  {
                    "spec": "message",
                    "type": "string",
                    "description": "The error message."
                  }
                ]
              }
            ]
          }
        }
        `)
        .commit ()

    .should ("dispatch the request to the target API")
        .project ("myapp")
        .before (async (s) =>
        {
            await s.object.init ();
        })
        .given (Context.new ("GET", "/api/hello?name=John&title=Mr."))
        .after (s => s.args[0].writeResponse ())
        .expectingPropertyToBeOfType ("args.0.response", "myapp.responses.HelloMessageReturned")
        .expectingPropertyToBe ("args.0.responseBody", `{"message":"Hello Mr. John!"}`)
        .expectingPropertyToBe ("args.0.status", 200)
        .expectingPropertyToBe ("args.0.res.statusMessage", "The hello message has been returned.")
        .expectingPropertyToBe ("args.0.responseHeaders.X-Response-Name", "HelloMessageReturned")
        .commit ()

    .reset ()
        .project ("myapp")
        .before (async (s) =>
        {
            await s.object.init ();
        })
        .given (Context.new ("GET", "/api/hello2?name=Jane"))
        .expectingPropertyToBe ("args.0.responseHeaders.X-Response-Name", undefined)
        .commit ()
;
