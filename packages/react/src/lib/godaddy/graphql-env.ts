/* eslint-disable */
/* prettier-ignore */

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * You may import it to create a `graphql()` tag function with `gql.tada`
 * by importing it and passing it to `initGraphQLTada<>()`.
 *
 * @example
 * ```
 * import { initGraphQLTada } from 'gql.tada';
 * import type { introspection } from './introspection';
 *
 * export const graphql = initGraphQLTada<{
 *   introspection: typeof introspection;
 *   scalars: {
 *     DateTime: string;
 *     Json: any;
 *   };
 * }>();
 * ```
 */
const introspection = {
  "__schema": {
    "queryType": {
      "name": "Query"
    },
    "mutationType": {
      "name": "Mutation"
    },
    "subscriptionType": null,
    "types": [
      {
        "kind": "OBJECT",
        "name": "Address",
        "fields": [
          {
            "name": "addressDetails",
            "type": {
              "kind": "OBJECT",
              "name": "AddressDetails"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "addressLine1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "AddressDetails",
        "fields": [
          {
            "name": "addressType",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "buildingName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "deliveryService",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "geoCoordinates",
            "type": {
              "kind": "OBJECT",
              "name": "GeoCoordinates"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "streetName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "streetNumber",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "streetType",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "subBuilding",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "AddressInput",
        "inputFields": [
          {
            "name": "addressLine1",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "AdjustmentAmount",
        "fields": [
          {
            "name": "amount",
            "type": {
              "kind": "OBJECT",
              "name": "SimpleMoney"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "AdjustmentPercentage",
        "fields": [
          {
            "name": "maximumAmount",
            "type": {
              "kind": "OBJECT",
              "name": "SimpleMoney"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "percentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "UNION",
        "name": "AdjustmentValue",
        "possibleTypes": [
          {
            "kind": "OBJECT",
            "name": "AdjustmentAmount"
          },
          {
            "kind": "OBJECT",
            "name": "AdjustmentPercentage"
          }
        ]
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ApplyShippingMethodInput",
        "inputFields": [
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "requestedProvider",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "requestedService",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "subTotal",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "MoneyInput"
            }
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "MoneyInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "SCALAR",
        "name": "Boolean"
      },
      {
        "kind": "OBJECT",
        "name": "CSSVariables",
        "fields": [
          {
            "name": "accent",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "accentForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "background",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "border",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "card",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "cardForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "defaultFontFamily",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "destructive",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "destructiveForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "fontMono",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "fontSans",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "fontSerif",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "foreground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "input",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "muted",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "mutedForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "popover",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "popoverForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "primary",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "primaryForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "radius",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "ring",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "secondary",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "secondaryBackground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "secondaryForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CSSVariablesInput",
        "inputFields": [
          {
            "name": "accent",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "accentForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "background",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "border",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "card",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "cardForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "defaultFontFamily",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "destructive",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "destructiveForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fontMono",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fontSans",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fontSerif",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "foreground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "input",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "muted",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "mutedForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "popover",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "popoverForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "primary",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "primaryForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "radius",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "ring",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "secondary",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "secondaryBackground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "secondaryForeground",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "UNION",
        "name": "CalculatedAdjustment",
        "possibleTypes": [
          {
            "kind": "OBJECT",
            "name": "CalculatedDiscount"
          },
          {
            "kind": "OBJECT",
            "name": "CalculatedFee"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "CalculatedAdjustmentOutput",
        "fields": [
          {
            "name": "adjustment",
            "type": {
              "kind": "UNION",
              "name": "CalculatedAdjustment"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalAmount",
            "type": {
              "kind": "OBJECT",
              "name": "SimpleMoney"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CalculatedDiscount",
        "fields": [
          {
            "name": "description",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "ID"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "label",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "UNION",
              "name": "AdjustmentValue"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CalculatedFee",
        "fields": [
          {
            "name": "description",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "ID"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "label",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "UNION",
              "name": "AdjustmentValue"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CalculatedLineOutput",
        "fields": [
          {
            "name": "adjustments",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "CalculatedAdjustmentOutput"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "calculationLine",
            "type": {
              "kind": "OBJECT",
              "name": "CalculationLineOutput"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalDiscountAmount",
            "type": {
              "kind": "OBJECT",
              "name": "SimpleMoney"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalFeeAmount",
            "type": {
              "kind": "OBJECT",
              "name": "SimpleMoney"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CalculationLineOutput",
        "fields": [
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "type",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutAuthToken",
        "fields": [
          {
            "name": "expiresAt",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "DateTime"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expiresIn",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "jwt",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "sessionId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSession",
        "fields": [
          {
            "name": "addresses",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "Address"
                }
              }
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "CheckoutSessionAddressesInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "appearance",
            "type": {
              "kind": "OBJECT",
              "name": "GoDaddyAppearance"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "channelId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "createdAt",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "DateTime"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "customerId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "defaultOperatingHours",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionStoreHours"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "draftOrder",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrder"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enableAddressAutocomplete",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enableBillingAddressCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enableLocalPickup",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enableNotesCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enablePaymentMethodCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enablePhoneCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enablePromotionCodes",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enableShipping",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enableShippingAddressCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enableSurcharge",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enableTaxCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enableTips",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enabledLocales",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enabledPaymentProviders",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "environment",
            "type": {
              "kind": "ENUM",
              "name": "CheckoutSessionEnvironment"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "experimental_rules",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionExperimentalRules"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expiresAt",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "DateTime"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "lineItems",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "DraftOrderLineItem"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "locations",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "CheckoutSessionLocation"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "paymentMethods",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionPaymentMethods"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "returnUrl",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "shipping",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionShippingOptions"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "skus",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "CheckoutSessionSkusConnection"
              }
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "sourceApp",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "status",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "ENUM",
                "name": "CheckoutSessionStatus"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "storeId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "storeName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "successUrl",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxes",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionTaxesOptions"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "token",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "updatedAt",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "DateTime"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "url",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionAddress",
        "fields": [
          {
            "name": "addressDetails",
            "type": {
              "kind": "OBJECT",
              "name": "AddressDetails"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "addressLine1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionAddressDetailsInput",
        "inputFields": [
          {
            "name": "addressType",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "buildingName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "deliveryService",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "geoCoordinates",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionGeoCoordinatesInput"
            }
          },
          {
            "name": "streetName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "streetNumber",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "streetType",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "subBuilding",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionAddressInput",
        "inputFields": [
          {
            "name": "addressDetails",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionAddressDetailsInput"
            }
          },
          {
            "name": "addressLine1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionAddressesInput",
        "inputFields": [
          {
            "name": "query",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionCalculateTaxesInput",
        "inputFields": [
          {
            "name": "destination",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionCalculationLocationInput"
            }
          },
          {
            "name": "lines",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "CheckoutSessionCalculationLineInput"
                  }
                }
              }
            }
          },
          {
            "name": "origin",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionCalculationLocationInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionCalculatedLine",
        "fields": [
          {
            "name": "calculationLine",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionCalculationLine"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxAmounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "CheckoutSessionTaxAmount"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalTaxAmount",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionTotalTaxAmount"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionCalculatedRate",
        "fields": [
          {
            "name": "calculationMethod",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "label",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionCalculatedRateValue"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionCalculatedRateValue",
        "fields": [
          {
            "name": "amount",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "appliedAmount",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "appliedPercentage",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "percentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionCalculationAddressInput",
        "inputFields": [
          {
            "name": "addressLine1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionCalculationLine",
        "fields": [
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionCalculationLineInput",
        "inputFields": [
          {
            "name": "classification",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "destination",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionCalculationLocationInput"
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "origin",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionCalculationLocationInput"
            }
          },
          {
            "name": "quantity",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Float"
              }
            }
          },
          {
            "name": "subtotalPrice",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "type",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "unitPrice",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "MoneyInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionCalculationLocationInput",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "CheckoutSessionCalculationAddressInput"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionCalculationResult",
        "fields": [
          {
            "name": "lines",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "CheckoutSessionCalculatedLine"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxAmounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "CheckoutSessionTaxAmount"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalTaxAmount",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionTotalTaxAmount"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionDayHours",
        "fields": [
          {
            "name": "closeTime",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "enabled",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "openTime",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionDayHoursInput",
        "inputFields": [
          {
            "name": "closeTime",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "enabled",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            }
          },
          {
            "name": "openTime",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "ENUM",
        "name": "CheckoutSessionEnvironment",
        "enumValues": [
          {
            "name": "dev",
            "isDeprecated": false
          },
          {
            "name": "ote",
            "isDeprecated": false
          },
          {
            "name": "prod",
            "isDeprecated": false
          },
          {
            "name": "test",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionExperimentalRules",
        "fields": [
          {
            "name": "freeShipping",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionFreeShippingRule"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "localDelivery",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionLocalDeliveryRule"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionExperimentalRulesInput",
        "inputFields": [
          {
            "name": "freeShipping",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionFreeShippingRuleInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionFreeShippingRule",
        "fields": [
          {
            "name": "enabled",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "minimumOrderTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionFreeShippingRuleInput",
        "inputFields": [
          {
            "name": "enabled",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            }
          },
          {
            "name": "minimumOrderTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionGeoCoordinatesInput",
        "inputFields": [
          {
            "name": "latitude",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Float"
              }
            }
          },
          {
            "name": "longitude",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Float"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionLineItemInput",
        "inputFields": [
          {
            "name": "quantity",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            }
          },
          {
            "name": "skuId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionLocalDeliveryRule",
        "fields": [
          {
            "name": "enabled",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "minimumOrderTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionLocation",
        "fields": [
          {
            "name": "address",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "CheckoutSessionAddress"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "isDefault",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "operatingHours",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionStoreHours"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionLocationInput",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "CheckoutSessionAddressInput"
              }
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "isDefault",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionOperatingHoursMap",
        "fields": [
          {
            "name": "default",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionStoreHours"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "locations",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "CheckoutSessionStoreHours"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionOperatingHoursMapInput",
        "inputFields": [
          {
            "name": "default",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "CheckoutSessionStoreHoursInput"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionPaymentMethodConfig",
        "fields": [
          {
            "name": "checkoutTypes",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "processor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionPaymentMethodConfigInput",
        "inputFields": [
          {
            "name": "checkoutTypes",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              }
            }
          },
          {
            "name": "processor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionPaymentMethods",
        "fields": [
          {
            "name": "applePay",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionPaymentMethodConfig"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "card",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionPaymentMethodConfig"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "express",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionPaymentMethodConfig"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "googlePay",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionPaymentMethodConfig"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "offline",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionPaymentMethodConfig"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "paypal",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionPaymentMethodConfig"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "paze",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionPaymentMethodConfig"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionPaymentMethodsInput",
        "inputFields": [
          {
            "name": "applePay",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionPaymentMethodConfigInput"
            }
          },
          {
            "name": "card",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionPaymentMethodConfigInput"
            }
          },
          {
            "name": "express",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionPaymentMethodConfigInput"
            }
          },
          {
            "name": "googlePay",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionPaymentMethodConfigInput"
            }
          },
          {
            "name": "offline",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionPaymentMethodConfigInput"
            }
          },
          {
            "name": "paypal",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionPaymentMethodConfigInput"
            }
          },
          {
            "name": "paze",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionPaymentMethodConfigInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionShippingOptions",
        "fields": [
          {
            "name": "fulfillmentLocationId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "originAddress",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionAddress"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionShippingOptionsInput",
        "inputFields": [
          {
            "name": "fulfillmentLocationId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "originAddress",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionAddressInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionSkusConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "OBJECT",
                "name": "CheckoutSessionSkusConnectionEdge"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionSkusConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "OBJECT",
              "name": "SKU"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "ENUM",
        "name": "CheckoutSessionStatus",
        "enumValues": [
          {
            "name": "ACTIVE",
            "isDeprecated": false
          },
          {
            "name": "CANCELLED",
            "isDeprecated": false
          },
          {
            "name": "COMPLETED",
            "isDeprecated": false
          },
          {
            "name": "CREATED",
            "isDeprecated": false
          },
          {
            "name": "EXPIRED",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionStoreHours",
        "fields": [
          {
            "name": "hours",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "CheckoutSessionWeekHours"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "leadTime",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pickupWindowInDays",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "timeZone",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionStoreHoursInput",
        "inputFields": [
          {
            "name": "hours",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "CheckoutSessionWeekHoursInput"
              }
            }
          },
          {
            "name": "leadTime",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            }
          },
          {
            "name": "pickupWindowInDays",
            "type": {
              "kind": "SCALAR",
              "name": "Int"
            }
          },
          {
            "name": "timeZone",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionTaxAmount",
        "fields": [
          {
            "name": "rate",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionCalculatedRate"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalTaxAmount",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionTotalTaxAmount"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionTaxesOptions",
        "fields": [
          {
            "name": "originAddress",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionAddress"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionTaxesOptionsInput",
        "inputFields": [
          {
            "name": "originAddress",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionAddressInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionTotalTaxAmount",
        "fields": [
          {
            "name": "currencyCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutSessionWeekHours",
        "fields": [
          {
            "name": "friday",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionDayHours"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "monday",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionDayHours"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "saturday",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionDayHours"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "sunday",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionDayHours"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "thursday",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionDayHours"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "tuesday",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionDayHours"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "wednesday",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionDayHours"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CheckoutSessionWeekHoursInput",
        "inputFields": [
          {
            "name": "friday",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionDayHoursInput"
            }
          },
          {
            "name": "monday",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionDayHoursInput"
            }
          },
          {
            "name": "saturday",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionDayHoursInput"
            }
          },
          {
            "name": "sunday",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionDayHoursInput"
            }
          },
          {
            "name": "thursday",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionDayHoursInput"
            }
          },
          {
            "name": "tuesday",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionDayHoursInput"
            }
          },
          {
            "name": "wednesday",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionDayHoursInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "CheckoutTokenValidation",
        "fields": [
          {
            "name": "expiresAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "sessionId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "valid",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ConfirmCheckoutBillingInfoInput",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "ConfirmCheckoutDestinationAddressInput"
            }
          },
          {
            "name": "companyName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "email",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "firstName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "lastName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "phone",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ConfirmCheckoutDestinationAddressInput",
        "inputFields": [
          {
            "name": "addressLine1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ConfirmCheckoutShippingInfoInput",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "ConfirmCheckoutDestinationAddressInput"
            }
          },
          {
            "name": "companyName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "email",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "firstName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "lastName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "phone",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ConfirmCheckoutShippingLineInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "requestedProvider",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "requestedService",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ConfirmCheckoutTaxInput"
                }
              }
            }
          },
          {
            "name": "totals",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "ConfirmCheckoutShippingLineTotalsInput"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ConfirmCheckoutShippingLineTotalsInput",
        "inputFields": [
          {
            "name": "subTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ConfirmCheckoutTaxInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "exempted",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "included",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ContactInput",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "DraftOrderAddressInput"
              }
            }
          },
          {
            "name": "companyName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "email",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "firstName",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "lastName",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "phone",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "CreateDraftLineItemInput",
        "inputFields": [
          {
            "name": "details",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "LineItemInputDetailsInfo"
            }
          },
          {
            "name": "discounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "DiscountInput"
                }
              }
            }
          },
          {
            "name": "externalId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fees",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "FeeInput"
                }
              }
            }
          },
          {
            "name": "fulfillmentChannelId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fulfillmentMode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "ENUM",
                "name": "LineItemModeInput"
              }
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "notes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "NoteInput"
                }
              }
            },
            "defaultValue": "[]"
          },
          {
            "name": "productId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "quantity",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Float"
              }
            }
          },
          {
            "name": "serviceEndsAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "serviceStartAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "shipping",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "LineItemInputShippingInfo"
            }
          },
          {
            "name": "skuId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "tags",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "TaxInput"
                }
              }
            }
          },
          {
            "name": "totals",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "LineItemTotalsInput"
              }
            }
          },
          {
            "name": "type",
            "type": {
              "kind": "ENUM",
              "name": "LineItemTypesInput"
            },
            "defaultValue": "PHYSICAL"
          },
          {
            "name": "unitAmount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "SCALAR",
        "name": "DateTime"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "DestinationAddressInput",
        "inputFields": [
          {
            "name": "addressLine1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "DiscountInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "appliedBeforeTax",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "code",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "referenceId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "DraftOrder",
        "fields": [
          {
            "name": "billing",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrderContact"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "calculatedAdjustments",
            "type": {
              "kind": "OBJECT",
              "name": "PriceAdjustmentsCalculationResult"
            },
            "args": [
              {
                "name": "discountCodes",
                "type": {
                  "kind": "LIST",
                  "ofType": {
                    "kind": "NON_NULL",
                    "ofType": {
                      "kind": "SCALAR",
                      "name": "String"
                    }
                  }
                }
              },
              {
                "name": "shippingLines",
                "type": {
                  "kind": "LIST",
                  "ofType": {
                    "kind": "NON_NULL",
                    "ofType": {
                      "kind": "INPUT_OBJECT",
                      "name": "PriceAdjustmentShippingLineInput"
                    }
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "calculatedShippingRates",
            "type": {
              "kind": "OBJECT",
              "name": "ShippingRateCalculationResult"
            },
            "args": [
              {
                "name": "destination",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "DestinationAddressInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "calculatedTaxes",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionCalculationResult"
            },
            "args": [
              {
                "name": "destination",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "TaxDestinationAddressInput"
                }
              },
              {
                "name": "lines",
                "type": {
                  "kind": "LIST",
                  "ofType": {
                    "kind": "NON_NULL",
                    "ofType": {
                      "kind": "INPUT_OBJECT",
                      "name": "TaxLineInput"
                    }
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "cartId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "context",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrderContext"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "createdAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "customerId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "discounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemDiscount"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "externalId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "fees",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemFee"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "fulfillmentModes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "ID"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "lineItems",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "DraftOrderLineItem"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "OrderMetafield"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "notes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemNote"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "number",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "numberDisplay",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "shipping",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrderContact"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "shippingLines",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "ShippingLine"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "statuses",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrderStatuses"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "tags",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxExempted",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemTax"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totals",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrderTotals"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "updatedAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "DraftOrderAddress",
        "fields": [
          {
            "name": "addressLine1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "DraftOrderAddressInput",
        "inputFields": [
          {
            "name": "addressLine1",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "DraftOrderContact",
        "fields": [
          {
            "name": "address",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrderAddress"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "companyName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "email",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "firstName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "lastName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "phone",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "DraftOrderContext",
        "fields": [
          {
            "name": "channelId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "owner",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "storeId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "DraftOrderLineItem",
        "fields": [
          {
            "name": "createdAt",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "details",
            "type": {
              "kind": "OBJECT",
              "name": "LineItemDetails"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "discounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemDiscount"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "externalId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "fees",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemFee"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "fulfilledAt",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "fulfillmentChannelId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": true
          },
          {
            "name": "fulfillmentMode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "OrderMetafield"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "notes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemNote"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "orderVersion",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "productId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "quantity",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "returnQuantity",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "returnTotals",
            "type": {
              "kind": "OBJECT",
              "name": "LineItemReturnTotals"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "returnedAt",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "serviceEndsAt",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "serviceStartAt",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "shipping",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrderContact"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "skuId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "status",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "tags",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemTax"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totals",
            "type": {
              "kind": "OBJECT",
              "name": "LineItemTotals"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "type",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "unitAmount",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "updatedAt",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "DraftOrderLineItemInput",
        "inputFields": [
          {
            "name": "details",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "LineItemInputDetailsInfo"
            }
          },
          {
            "name": "discounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "DiscountInput"
                }
              }
            }
          },
          {
            "name": "externalId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fees",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "FeeInput"
                }
              }
            }
          },
          {
            "name": "fulfillmentMode",
            "type": {
              "kind": "ENUM",
              "name": "LineItemModeInput"
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "notes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "NoteInput"
                }
              }
            },
            "defaultValue": "[]"
          },
          {
            "name": "productId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "quantity",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            }
          },
          {
            "name": "serviceEndsAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "serviceStartAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "shipping",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "LineItemInputShippingInfo"
            }
          },
          {
            "name": "skuId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "tags",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "TaxInput"
                }
              }
            }
          },
          {
            "name": "totals",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "LineItemTotalsInput"
            }
          },
          {
            "name": "type",
            "type": {
              "kind": "ENUM",
              "name": "LineItemTypesInput"
            },
            "defaultValue": "PHYSICAL"
          },
          {
            "name": "unitAmount",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "MoneyInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "DraftOrderStatuses",
        "fields": [
          {
            "name": "fulfillmentStatus",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "paymentStatus",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "status",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "DraftOrderTotals",
        "fields": [
          {
            "name": "discountTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "feeTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "shippingTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "subTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "total",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ExchangeCheckoutTokenInput",
        "inputFields": [
          {
            "name": "sessionId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "token",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ExternalIdsInput",
        "inputFields": [
          {
            "name": "type",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "value",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "FeeInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "appliedBeforeTax",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "referenceId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "SCALAR",
        "name": "Float"
      },
      {
        "kind": "ENUM",
        "name": "FulfillmentModeInput",
        "enumValues": [
          {
            "name": "CURBSIDE",
            "isDeprecated": false
          },
          {
            "name": "DELIVERY",
            "isDeprecated": false
          },
          {
            "name": "DIGITAL",
            "isDeprecated": false
          },
          {
            "name": "DRIVE_THRU",
            "isDeprecated": false
          },
          {
            "name": "FOR_HERE",
            "isDeprecated": false
          },
          {
            "name": "GENERAL_CONTAINER",
            "isDeprecated": false
          },
          {
            "name": "GIFT_CARD",
            "isDeprecated": false
          },
          {
            "name": "NONE",
            "isDeprecated": false
          },
          {
            "name": "NON_LODGING_NRR",
            "isDeprecated": false
          },
          {
            "name": "NON_LODGING_SALE",
            "isDeprecated": false
          },
          {
            "name": "PICKUP",
            "isDeprecated": false
          },
          {
            "name": "PURCHASE",
            "isDeprecated": false
          },
          {
            "name": "QUICK_STAY",
            "isDeprecated": false
          },
          {
            "name": "REGULAR_STAY",
            "isDeprecated": false
          },
          {
            "name": "SHIP",
            "isDeprecated": false
          },
          {
            "name": "TO_GO",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "GeoCoordinates",
        "fields": [
          {
            "name": "latitude",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "longitude",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "GoDaddyAppearance",
        "fields": [
          {
            "name": "theme",
            "type": {
              "kind": "ENUM",
              "name": "GoDaddyTheme"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "variables",
            "type": {
              "kind": "OBJECT",
              "name": "CSSVariables"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "GoDaddyAppearanceInput",
        "inputFields": [
          {
            "name": "theme",
            "type": {
              "kind": "ENUM",
              "name": "GoDaddyTheme"
            }
          },
          {
            "name": "variables",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CSSVariablesInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "ENUM",
        "name": "GoDaddyTheme",
        "enumValues": [
          {
            "name": "base",
            "isDeprecated": false
          },
          {
            "name": "orange",
            "isDeprecated": false
          },
          {
            "name": "purple",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "SCALAR",
        "name": "ID"
      },
      {
        "kind": "SCALAR",
        "name": "Int"
      },
      {
        "kind": "OBJECT",
        "name": "LineItemDetails",
        "fields": [
          {
            "name": "productAssetUrl",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "selectedAddons",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "SelectedAddon"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "selectedOptions",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "SelectedOption"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "sku",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "unitOfMeasure",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "LineItemDiscount",
        "fields": [
          {
            "name": "amount",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "appliedBeforeTax",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "code",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "OrderMetafield"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "LineItemFee",
        "fields": [
          {
            "name": "amount",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "appliedBeforeTax",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "OrderMetafield"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "LineItemInputDetailsInfo",
        "inputFields": [
          {
            "name": "productAssetUrl",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "selectedAddons",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "SelectedAddonInput"
                }
              }
            }
          },
          {
            "name": "selectedOptions",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "SelectedOptionInput"
                }
              }
            }
          },
          {
            "name": "sku",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "unitOfMeasure",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "LineItemInputShippingInfo",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "OrderAddressInput"
            }
          },
          {
            "name": "companyName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "email",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "firstName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "lastName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "phone",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "ENUM",
        "name": "LineItemModeInput",
        "enumValues": [
          {
            "name": "CURBSIDE",
            "isDeprecated": false
          },
          {
            "name": "DELIVERY",
            "isDeprecated": false
          },
          {
            "name": "DIGITAL",
            "isDeprecated": false
          },
          {
            "name": "DRIVE_THRU",
            "isDeprecated": false
          },
          {
            "name": "FOR_HERE",
            "isDeprecated": false
          },
          {
            "name": "GENERAL_CONTAINER",
            "isDeprecated": false
          },
          {
            "name": "GIFT_CARD",
            "isDeprecated": false
          },
          {
            "name": "NONE",
            "isDeprecated": false
          },
          {
            "name": "NON_LODGING_NRR",
            "isDeprecated": false
          },
          {
            "name": "NON_LODGING_SALE",
            "isDeprecated": false
          },
          {
            "name": "PICKUP",
            "isDeprecated": false
          },
          {
            "name": "PURCHASE",
            "isDeprecated": false
          },
          {
            "name": "QUICK_STAY",
            "isDeprecated": false
          },
          {
            "name": "REGULAR_STAY",
            "isDeprecated": false
          },
          {
            "name": "SHIP",
            "isDeprecated": false
          },
          {
            "name": "TO_GO",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "LineItemNote",
        "fields": [
          {
            "name": "author",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "authorType",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "content",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "createdAt",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "deletedAt",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "OrderMetafield"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "shouldNotifyCustomer",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "LineItemReturnTotals",
        "fields": [
          {
            "name": "discountTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "feeTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "subTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "total",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "LineItemTax",
        "fields": [
          {
            "name": "amount",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "exempted",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "included",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "OrderMetafield"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "LineItemTotals",
        "fields": [
          {
            "name": "discountTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "feeTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "subTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "LineItemTotalsInput",
        "inputFields": [
          {
            "name": "discountTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "feeTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "subTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "ENUM",
        "name": "LineItemTypesInput",
        "enumValues": [
          {
            "name": "ALL",
            "isDeprecated": false
          },
          {
            "name": "DIGITAL",
            "isDeprecated": false
          },
          {
            "name": "PAY_LINK",
            "isDeprecated": false
          },
          {
            "name": "PHYSICAL",
            "isDeprecated": false
          },
          {
            "name": "SERVICE",
            "isDeprecated": false
          },
          {
            "name": "STAY",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "ENUM",
        "name": "MetafieldTypeInput",
        "enumValues": [
          {
            "name": "JSON",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MoneyInput",
        "inputFields": [
          {
            "name": "currencyCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "value",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "MoneyValue",
        "fields": [
          {
            "name": "currencyCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "SCALAR",
              "name": "Int"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "Mutation",
        "fields": [
          {
            "name": "applyCheckoutSessionDeliveryMethod",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSession"
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "MutationApplyCheckoutSessionDeliveryMethodInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "applyCheckoutSessionDiscount",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrder"
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "MutationApplyCheckoutSessionDiscountInput"
                  }
                }
              },
              {
                "name": "sessionId",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "applyCheckoutSessionFulfillmentLocation",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSession"
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "MutationApplyCheckoutSessionFulfillmentLocationInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "applyCheckoutSessionShippingMethod",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSession"
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "LIST",
                    "ofType": {
                      "kind": "NON_NULL",
                      "ofType": {
                        "kind": "INPUT_OBJECT",
                        "name": "ApplyShippingMethodInput"
                      }
                    }
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "calculateCheckoutSessionTaxes",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSessionCalculationResult"
            },
            "args": [
              {
                "name": "destination",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "TaxDestinationAddressInput"
                }
              },
              {
                "name": "lines",
                "type": {
                  "kind": "LIST",
                  "ofType": {
                    "kind": "NON_NULL",
                    "ofType": {
                      "kind": "INPUT_OBJECT",
                      "name": "TaxLineInput"
                    }
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "confirmCheckoutSession",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSession"
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "MutationConfirmCheckoutSessionInput"
                  }
                }
              },
              {
                "name": "sessionId",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "createCheckoutSession",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSession"
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "MutationCreateCheckoutSessionInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "exchangeCheckoutToken",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutAuthToken"
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "MutationExchangeCheckoutTokenInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "expireCheckoutSession",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSession"
            },
            "args": [
              {
                "name": "id",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "refreshCheckoutToken",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutAuthToken"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "removeAppliedCheckoutSessionShippingMethod",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSession"
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "RemoveShippingMethodInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "updateCheckoutSession",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSession"
            },
            "args": [
              {
                "name": "id",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              },
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "MutationUpdateCheckoutSessionInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "updateCheckoutSessionDraftOrder",
            "type": {
              "kind": "OBJECT",
              "name": "DraftOrder"
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "MutationUpdateCheckoutSessionDraftOrderInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "verifyAddress",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "Address"
                }
              }
            },
            "args": [
              {
                "name": "input",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "MutationVerifyAddressInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MutationApplyCheckoutSessionDeliveryMethodInput",
        "inputFields": [
          {
            "name": "mode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "ENUM",
                "name": "FulfillmentModeInput"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MutationApplyCheckoutSessionDiscountInput",
        "inputFields": [
          {
            "name": "discountCodes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MutationApplyCheckoutSessionFulfillmentLocationInput",
        "inputFields": [
          {
            "name": "fulfillmentLocationId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MutationConfirmCheckoutSessionInput",
        "inputFields": [
          {
            "name": "billing",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "ConfirmCheckoutBillingInfoInput"
            }
          },
          {
            "name": "fulfillmentEndAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "fulfillmentLocationId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fulfillmentStartAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "paymentProcessor",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "paymentProvider",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "paymentToken",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "paymentType",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "shipping",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "ConfirmCheckoutShippingInfoInput"
            }
          },
          {
            "name": "shippingLines",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ConfirmCheckoutShippingLineInput"
                }
              }
            }
          },
          {
            "name": "shippingTotal",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "MoneyInput"
            }
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "MoneyInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MutationCreateCheckoutSessionInput",
        "inputFields": [
          {
            "name": "appearance",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "GoDaddyAppearanceInput"
            }
          },
          {
            "name": "channelId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "customerId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "draftOrderId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "enableAddressAutocomplete",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableBillingAddressCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableLocalPickup",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableNotesCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enablePaymentMethodCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enablePhoneCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enablePromotionCodes",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableShipping",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableShippingAddressCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableSurcharge",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableTaxCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableTips",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enabledLocales",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "enabledPaymentProviders",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "environment",
            "type": {
              "kind": "ENUM",
              "name": "CheckoutSessionEnvironment"
            }
          },
          {
            "name": "experimental_rules",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionExperimentalRulesInput"
            }
          },
          {
            "name": "expiresAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "lineItems",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "CheckoutSessionLineItemInput"
                }
              }
            }
          },
          {
            "name": "locations",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "CheckoutSessionLocationInput"
                }
              }
            }
          },
          {
            "name": "operatingHours",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionOperatingHoursMapInput"
            }
          },
          {
            "name": "paymentMethods",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionPaymentMethodsInput"
            }
          },
          {
            "name": "returnUrl",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "shipping",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionShippingOptionsInput"
            }
          },
          {
            "name": "sourceApp",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "storeId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "storeName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "successUrl",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "taxes",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionTaxesOptionsInput"
            }
          },
          {
            "name": "url",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MutationExchangeCheckoutTokenInput",
        "inputFields": [
          {
            "name": "sessionId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "token",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MutationUpdateCheckoutSessionDraftOrderInput",
        "inputFields": [
          {
            "name": "billing",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "OrderBillingInfoInput"
            }
          },
          {
            "name": "cartId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "context",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "OrderContextInputUpdate"
              }
            }
          },
          {
            "name": "customerId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "discounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "UpdateDiscountInput"
                }
              }
            }
          },
          {
            "name": "externalId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fees",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "UpdateFeeInput"
                }
              }
            }
          },
          {
            "name": "lineItems",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateDraftOrderLineItemsInput"
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "notes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "NoteInput"
                }
              }
            }
          },
          {
            "name": "shipping",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "OrderShippingInfoInput"
            }
          },
          {
            "name": "shippingLines",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "UpdateDraftShippingLineInput"
                }
              }
            }
          },
          {
            "name": "staffUserIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "tags",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "taxExempted",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "UpdateOrderTaxInput"
                }
              }
            }
          },
          {
            "name": "totals",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "OrderTotalsInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MutationUpdateCheckoutSessionInput",
        "inputFields": [
          {
            "name": "appearance",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "GoDaddyAppearanceInput"
            }
          },
          {
            "name": "channelId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "customerId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "enableAddressAutocomplete",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableBillingAddressCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableLocalPickup",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableNotesCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enablePaymentMethodCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enablePhoneCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enablePromotionCodes",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableShipping",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableShippingAddressCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableSurcharge",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableTaxCollection",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enableTips",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "enabledLocales",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "enabledPaymentProviders",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "environment",
            "type": {
              "kind": "ENUM",
              "name": "CheckoutSessionEnvironment"
            }
          },
          {
            "name": "experimental_rules",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionExperimentalRulesInput"
            }
          },
          {
            "name": "expiresAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "locations",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "CheckoutSessionLocationInput"
                }
              }
            }
          },
          {
            "name": "operatingHours",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionOperatingHoursMapInput"
            }
          },
          {
            "name": "paymentMethods",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "CheckoutSessionPaymentMethodsInput"
            }
          },
          {
            "name": "returnUrl",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "sourceApp",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "storeId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "storeName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "successUrl",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "url",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "MutationVerifyAddressInput",
        "inputFields": [
          {
            "name": "addressLine1",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "ENUM",
        "name": "NoteAuthorTypeInput",
        "enumValues": [
          {
            "name": "CUSTOMER",
            "isDeprecated": false
          },
          {
            "name": "MERCHANT",
            "isDeprecated": false
          },
          {
            "name": "NONE",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "NoteInput",
        "inputFields": [
          {
            "name": "author",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "authorType",
            "type": {
              "kind": "ENUM",
              "name": "NoteAuthorTypeInput"
            }
          },
          {
            "name": "content",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "createdAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "deletedAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "referenceId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "shouldNotifyCustomer",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "SCALAR",
        "name": "Null"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "OrderAddressInput",
        "inputFields": [
          {
            "name": "addressLine1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "OrderBillingInfoInput",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "OrderAddressInput"
            }
          },
          {
            "name": "companyName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "email",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "firstName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "lastName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "phone",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "OrderContextInputUpdate",
        "inputFields": [
          {
            "name": "channelId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "storeId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "OrderMetafield",
        "fields": [
          {
            "name": "key",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "type",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "OrderMetafieldInput",
        "inputFields": [
          {
            "name": "key",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "type",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "ENUM",
                "name": "MetafieldTypeInput"
              }
            },
            "defaultValue": "JSON"
          },
          {
            "name": "value",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "OrderShippingInfoInput",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "OrderAddressInput"
            }
          },
          {
            "name": "companyName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "email",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "firstName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "lastName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "phone",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "OrderTotalsInput",
        "inputFields": [
          {
            "name": "discountTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "feeTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "shippingTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "subTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "total",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "PageInfo",
        "fields": [
          {
            "name": "endCursor",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "hasNextPage",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "hasPreviousPage",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "startCursor",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "PriceAdjustmentShippingLineInput",
        "inputFields": [
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "subTotal",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "PriceAdjustmentsCalculationResult",
        "fields": [
          {
            "name": "adjustments",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "CalculatedAdjustmentOutput"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "lines",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "CalculatedLineOutput"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalDiscountAmount",
            "type": {
              "kind": "OBJECT",
              "name": "SimpleMoney"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalFeeAmount",
            "type": {
              "kind": "OBJECT",
              "name": "SimpleMoney"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "Query",
        "fields": [
          {
            "name": "checkoutSession",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutSession"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "validateCheckoutToken",
            "type": {
              "kind": "OBJECT",
              "name": "CheckoutTokenValidation"
            },
            "args": [
              {
                "name": "token",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              }
            ],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "RemoveShippingMethodInput",
        "inputFields": [
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "serviceCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "SKU",
        "fields": [
          {
            "name": "attributeValues",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "SKUAttributeValue"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "attributes",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "SKUAttribute"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "code",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "createdAt",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "DateTime"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "description",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "disableShipping",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "htmlDescription",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ID"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "label",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "mediaUrls",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "metafields",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "SKUMetafieldsConnection"
              }
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "prices",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "SKUPrice"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "status",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "unitOfWeight",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "updatedAt",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "DateTime"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "weight",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "SKUAttribute",
        "fields": [
          {
            "name": "description",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "htmlDescription",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ID"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "label",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "values",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "SKUAttributeValue"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "SKUAttributeValue",
        "fields": [
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ID"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "label",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "SKUMetafield",
        "fields": [
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ID"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "key",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "namespace",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "SKUMetafieldsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "OBJECT",
                "name": "SKUMetafieldsConnectionEdge"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "SKUMetafieldsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "OBJECT",
              "name": "SKUMetafield"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "SKUPrice",
        "fields": [
          {
            "name": "currencyCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Float"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "SelectedAddon",
        "fields": [
          {
            "name": "attribute",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "sku",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "values",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "SelectedAddonValue"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "SelectedAddonInput",
        "inputFields": [
          {
            "name": "attribute",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "sku",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "values",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "SelectedAddonValueInput"
                  }
                }
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "SelectedAddonValue",
        "fields": [
          {
            "name": "costAdjustment",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "SelectedAddonValueInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "MoneyInput"
            }
          },
          {
            "name": "amountIncreased",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "costAdjustment",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "SelectedOption",
        "fields": [
          {
            "name": "attribute",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "values",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "SelectedOptionInput",
        "inputFields": [
          {
            "name": "attribute",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "values",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "ShippingLine",
        "fields": [
          {
            "name": "amount",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "discounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemDiscount"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "OrderMetafield"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "requestedProvider",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "requestedService",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "LineItemTax"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totals",
            "type": {
              "kind": "OBJECT",
              "name": "ShippingLineTotals"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ShippingLineTotals",
        "fields": [
          {
            "name": "subTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "OBJECT",
              "name": "MoneyValue"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "ENUM",
        "name": "ShippingLineType",
        "enumValues": [
          {
            "name": "FEE",
            "isDeprecated": false
          },
          {
            "name": "SHIPPING",
            "isDeprecated": false
          },
          {
            "name": "SKU",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "ShippingRate",
        "fields": [
          {
            "name": "carrierCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "cost",
            "type": {
              "kind": "OBJECT",
              "name": "ShippingRateMoneyValue"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "description",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "displayName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "features",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "maxDeliveryDate",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "minDeliveryDate",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "serviceCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ShippingRateCalculationResult",
        "fields": [
          {
            "name": "rates",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "OBJECT",
                  "name": "ShippingRate"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ShippingRateMoneyValue",
        "fields": [
          {
            "name": "currencyCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "SimpleMoney",
        "fields": [
          {
            "name": "currencyCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "value",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "SCALAR",
        "name": "String"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "TaxDestinationAddressInput",
        "inputFields": [
          {
            "name": "addressLine1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "addressLine3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea1",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea2",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea3",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "adminArea4",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "countryCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "postalCode",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "TaxInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "exempted",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "included",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "referenceId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "TaxLineInput",
        "inputFields": [
          {
            "name": "classification",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "destination",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "TaxDestinationAddressInput"
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "origin",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "TaxDestinationAddressInput"
            }
          },
          {
            "name": "quantity",
            "type": {
              "kind": "SCALAR",
              "name": "Int"
            }
          },
          {
            "name": "subtotalPrice",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "MoneyInput"
              }
            }
          },
          {
            "name": "type",
            "type": {
              "kind": "ENUM",
              "name": "ShippingLineType"
            }
          },
          {
            "name": "unitPrice",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "MoneyInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateDiscountInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          },
          {
            "name": "appliedBeforeTax",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "code",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "referenceId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateDraftLineItemInput",
        "inputFields": [
          {
            "name": "details",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "LineItemInputDetailsInfo"
            }
          },
          {
            "name": "discounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "DiscountInput"
                }
              }
            }
          },
          {
            "name": "externalId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fees",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "FeeInput"
                }
              }
            }
          },
          {
            "name": "fulfillmentChannelId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "fulfillmentMode",
            "type": {
              "kind": "ENUM",
              "name": "LineItemModeInput"
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "notes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "NoteInput"
                }
              }
            },
            "defaultValue": "[]"
          },
          {
            "name": "productId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "quantity",
            "type": {
              "kind": "SCALAR",
              "name": "Float"
            }
          },
          {
            "name": "serviceEndsAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "serviceStartAt",
            "type": {
              "kind": "SCALAR",
              "name": "DateTime"
            }
          },
          {
            "name": "shipping",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "LineItemInputShippingInfo"
            }
          },
          {
            "name": "skuId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "tags",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "TaxInput"
                }
              }
            }
          },
          {
            "name": "totals",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "LineItemTotalsInput"
            }
          },
          {
            "name": "type",
            "type": {
              "kind": "ENUM",
              "name": "LineItemTypesInput"
            }
          },
          {
            "name": "unitAmount",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "MoneyInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateDraftOrderInput",
        "inputFields": [
          {
            "name": "lineItems",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateDraftOrderLineItemsInput"
            }
          },
          {
            "name": "notes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "NoteInput"
                }
              }
            }
          },
          {
            "name": "taxExempted",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateDraftOrderLineItemsInput",
        "inputFields": [
          {
            "name": "add",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "CreateDraftLineItemInput"
                }
              }
            }
          },
          {
            "name": "remove",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              }
            }
          },
          {
            "name": "update",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "UpdateDraftLineItemInput"
                }
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateDraftShippingLineInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          },
          {
            "name": "discounts",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "UpdateDiscountInput"
                }
              }
            }
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "fees",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "UpdateFeeInput"
                }
              }
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "requestedProvider",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "requestedService",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "UpdateTaxInput"
                }
              }
            }
          },
          {
            "name": "totals",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateDraftShippingLineTotalsInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateDraftShippingLineTotalsInput",
        "inputFields": [
          {
            "name": "subTotal",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateFeeInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          },
          {
            "name": "appliedBeforeTax",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "referenceId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateMoneyInput",
        "inputFields": [
          {
            "name": "currencyCode",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "value",
            "type": {
              "kind": "SCALAR",
              "name": "Int"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateNoteInput",
        "inputFields": [
          {
            "name": "author",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "authorType",
            "type": {
              "kind": "ENUM",
              "name": "NoteAuthorTypeInput"
            }
          },
          {
            "name": "content",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "shouldNotifyCustomer",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateOrderTaxInput",
        "inputFields": [
          {
            "name": "additional",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "amount",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          },
          {
            "name": "exempted",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "included",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "referenceId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateShippingLineInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "requestedProvider",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "requestedService",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "taxes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "UpdateTaxInput"
                }
              }
            }
          },
          {
            "name": "totals",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateShippingLineTotalsInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateShippingLineTotalsInput",
        "inputFields": [
          {
            "name": "subTotal",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          },
          {
            "name": "taxTotal",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "UpdateTaxInput",
        "inputFields": [
          {
            "name": "amount",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "UpdateMoneyInput"
            }
          },
          {
            "name": "exempted",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "externalIds",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "ExternalIdsInput"
                }
              }
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "included",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            }
          },
          {
            "name": "metafields",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INPUT_OBJECT",
                  "name": "OrderMetafieldInput"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "ratePercentage",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          },
          {
            "name": "referenceId",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      }
    ],
    "directives": []
  }
} as const;

export { introspection };