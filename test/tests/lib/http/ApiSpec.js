test.method ("http.ApiSpec.Constraint", "import", true)
    .should ("import an constraint")
        .before (s =>
        {
            s.args = [null, nit.new ("constraints.Exclusive", ["fa", "fb"])];
        })
        .expectingMethodToReturnValue ("result.toJson", "  ", nit.trim.text`
        {
          "type": "exclusive",
          "code": "error.exclusive_fields",
          "message": "Exactly one of following fields must be specified: %{constraint.fields.join (', ')}. (%{specified} specified)",
          "options": {
            "fields": [
              "fa",
              "fb"
            ],
            "optional": false
          }
        }
        `)
        .commit ()

    .reset ()
        .before (s =>
        {
            s.args =
            [
                null,
                nit.new ("constraints.Exclusive", ["fa", "fb"],
                {
                    name: "ex1",
                    condition: "opt1 > opt2"
                })
            ];
        })
        .expectingMethodToReturnValue ("result.toJson", "  ", nit.trim.text`
        {
          "type": "exclusive",
          "code": "error.exclusive_fields",
          "message": "Exactly one of following fields must be specified: %{constraint.fields.join (', ')}. (%{specified} specified)",
          "name": "ex1",
          "condition": "opt1 > opt2",
          "options": {
            "fields": [
              "fa",
              "fb"
            ],
            "optional": false
          }
        }
        `)
        .commit ()
;



test.method ("http.ApiSpec", "import")
    .should ("create a spec from an API")
    .project ("myapp", true)
    .before (s =>
    {
        let comp = nit.listComponents ("apis").find (c => c.className.endsWith ("Hello"));

        s.args = comp.class;
    })
    .after (s =>
    {
        let comp = nit.listComponents ("apis").find (c => c.className.endsWith ("CheckIn"));
        s.result.import (comp.class);

        comp = nit.listComponents ("apis").find (c => c.className.endsWith ("GetApiSpec"));
        s.result.import (comp.class);
    })
    .expectingMethodToReturnValue ("result.toJson", "  ", nit.trim.text`
    {
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
            "CheckInRecorded"
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
                    "message": "The %{property.kind} '%{property.name}' is assigned to an invalid value '%{value}'. (Allowed: %{constraint.choiceValues.slice (0, 10).join (', ') + (constraint.choiceValues.length > 10 ? '...' : '')})",
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
                    "message": "The %{property.kind} '%{property.name}' is assigned to an invalid value '%{value}'. (Allowed: %{constraint.choiceValues.slice (0, 10).join (', ') + (constraint.choiceValues.length > 10 ? '...' : '')})",
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
    `)
    .commit ()
;
