test.method ("http.apis.GetApiSpec", "run")
    .should ("return the API spec")
    .useApi ("http:get-api-spec")
    .before (s =>
    {
        let ctx = s.Context.new ("GET", "/");

        ctx.service = s.service;

        s.args = new s.api.constructor.Context (ctx);
    })
    .expectingPropertyToBeOfType ("args.0.response", "http.responses.ApiSpecReturned")
    .expectingMethodToReturnValue ("args.0.response.spec.toJson", "  ", nit.trim.text`
    {
      "apis": [
        {
          "name": "GetApiSpec",
          "method": "GET",
          "path": "/",
          "description": "Get the API specification.",
          "responses": [
            "ApiSpecReturned"
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
        }
      ]
    }
    `)
    .commit ()
;
