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
  name: 'orders-api',
  __schema: {
    queryType: {
      name: 'Query',
    },
    mutationType: {
      name: 'Mutation',
    },
    subscriptionType: null,
    types: [
      {
        kind: 'INPUT_OBJECT',
        name: 'AddDraftOrderInput',
        inputFields: [
          {
            name: 'externalId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'cartId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'context',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'OrderContextInput',
              },
            },
          },
          {
            name: 'totals',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'OrderTotalsInput',
            },
          },
          {
            name: 'customerId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'billing',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'OrderBillingInfoInput',
            },
          },
          {
            name: 'shipping',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'OrderShippingInfoInput',
            },
          },
          {
            name: 'lineItems',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreateDraftLineItemInput',
                },
              },
            },
          },
          {
            name: 'shippingLines',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ShippingLineInput',
                },
              },
            },
            defaultValue: '[]',
          },
          {
            name: 'discounts',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'DiscountInput',
                },
              },
            },
            defaultValue: '[]',
          },
          {
            name: 'fees',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'FeeInput',
                },
              },
            },
            defaultValue: '[]',
          },
          {
            name: 'taxes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderTaxInput',
                },
              },
            },
            defaultValue: '[]',
          },
          {
            name: 'notes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'NoteInput',
                },
              },
            },
            defaultValue: '[]',
          },
          {
            name: 'tags',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            },
          },
          {
            name: 'taxExempted',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'AddLineItemDetailsInput',
        inputFields: [
          {
            name: 'productAssetUrl',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'selectedAddons',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'AddLineItemSelectedAddonsInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'AddLineItemInput',
        inputFields: [
          {
            name: 'orderId',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'ID',
              },
            },
          },
          {
            name: 'skuId',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'details',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'AddLineItemDetailsInput',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'fulfillmentChannelId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'quantity',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Int',
              },
            },
          },
          {
            name: 'fulfillmentMode',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'ENUM',
                name: 'LineItemModeInput',
              },
            },
          },
          {
            name: 'status',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'ENUM',
                name: 'LineItemStatusInput',
              },
            },
          },
          {
            name: 'updateQuantity',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'AddLineItemSelectedAddonsInput',
        inputFields: [
          {
            name: 'optionId',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'values',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'LIST',
                ofType: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'INPUT_OBJECT',
                    name: 'AddLineItemSelectedAddonsValuesInput',
                  },
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'AddLineItemSelectedAddonsValuesInput',
        inputFields: [
          {
            name: 'optionValueId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'inputValue',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'AddressV2',
        fields: [
          {
            name: 'addressLine1',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'addressLine2',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'addressLine3',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'adminArea1',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'adminArea2',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'adminArea3',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'adminArea4',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'countryCode',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'postalCode',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ApplyDiscountCodesInput',
        inputFields: [
          {
            name: 'orderId',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'ID',
              },
            },
          },
          {
            name: 'discountCodes',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'LIST',
                ofType: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'String',
                  },
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'SCALAR',
        name: 'Boolean',
      },
      {
        kind: 'OBJECT',
        name: 'Context',
        fields: [
          {
            name: 'channelId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'storeId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'CreateDraftLineItemInput',
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'externalId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'type',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'ENUM',
                name: 'LineItemTypesInput',
              },
            },
            defaultValue: 'PHYSICAL',
          },
          {
            name: 'name',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'fulfillmentMode',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'ENUM',
                name: 'LineItemModeInput',
              },
            },
          },
          {
            name: 'totals',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'TotalsInput',
              },
            },
          },
          {
            name: 'unitAmount',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'quantity',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Float',
              },
            },
          },
          {
            name: 'notes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'NoteInput',
                },
              },
            },
            defaultValue: '[]',
          },
          {
            name: 'skuId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'shipping',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'LineItemInputShippingInfo',
            },
          },
          {
            name: 'details',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'LineItemInputDetailsInfo',
            },
          },
          {
            name: 'tags',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            },
          },
          {
            name: 'serviceStartAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
          },
          {
            name: 'serviceEndsAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
          },
          {
            name: 'discounts',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'DiscountInput',
                },
              },
            },
          },
          {
            name: 'fees',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'FeeInput',
                },
              },
            },
          },
          {
            name: 'taxes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'TaxInput',
                },
              },
            },
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'SCALAR',
        name: 'DateTime',
      },
      {
        kind: 'OBJECT',
        name: 'Discount',
        fields: [
          {
            name: 'amount',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'appliedBeforeTax',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'code',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'externalIds',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'OrderMetafield',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: true,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'DiscountInput',
        inputFields: [
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'code',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'appliedBeforeTax',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ExternalIdsInput',
        inputFields: [
          {
            name: 'type',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'value',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'Fee',
        fields: [
          {
            name: 'amount',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'appliedBeforeTax',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'externalIds',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'OrderMetafield',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: true,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'FeeInput',
        inputFields: [
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'appliedBeforeTax',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'SCALAR',
        name: 'Float',
      },
      {
        kind: 'SCALAR',
        name: 'ID',
      },
      {
        kind: 'SCALAR',
        name: 'Int',
      },
      {
        kind: 'OBJECT',
        name: 'LineItem',
        fields: [
          {
            name: 'createdAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'details',
            type: {
              kind: 'OBJECT',
              name: 'LineItemDetails',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'discounts',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'Discount',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'externalId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'fees',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'Fee',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'fulfillmentChannelId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'fulfillmentMode',
            type: {
              kind: 'ENUM',
              name: 'LineItemMode',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'id',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'ID',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'OrderMetafield',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'notes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'Note',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'quantity',
            type: {
              kind: 'SCALAR',
              name: 'Float',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'serviceEndsAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'serviceStartAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'shipping',
            type: {
              kind: 'OBJECT',
              name: 'ShippingInfo',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'skuId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'tags',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'taxes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'Tax',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totals',
            type: {
              kind: 'OBJECT',
              name: 'LineItemTotals',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'type',
            type: {
              kind: 'ENUM',
              name: 'LineItemTypes',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'unitAmount',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [
          {
            kind: 'INTERFACE',
            name: 'Node',
          },
        ],
      },
      {
        kind: 'OBJECT',
        name: 'LineItemDetails',
        fields: [
          {
            name: 'productAssetUrl',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'selectedAddons',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'SelectedAddon',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'selectedOptions',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'SelectedOption',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'sku',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'unitOfMeasure',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'LineItemInputDetailsInfo',
        inputFields: [
          {
            name: 'sku',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'productAssetUrl',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'selectedAddons',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'SelectedAddonInput',
                },
              },
            },
          },
          {
            name: 'selectedOptions',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'SelectedOptionInput',
                },
              },
            },
          },
          {
            name: 'unitOfMeasure',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'LineItemInputShippingInfo',
        inputFields: [
          {
            name: 'address',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'OrderAddressInput',
            },
          },
          {
            name: 'firstName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'lastName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'phone',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'email',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'companyName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'ENUM',
        name: 'LineItemMode',
        enumValues: [
          {
            name: 'NONE',
            isDeprecated: false,
          },
          {
            name: 'PICKUP',
            isDeprecated: false,
          },
          {
            name: 'SHIP',
            isDeprecated: false,
          },
          {
            name: 'CURBSIDE',
            isDeprecated: false,
          },
          {
            name: 'DELIVERY',
            isDeprecated: false,
          },
          {
            name: 'DRIVE_THRU',
            isDeprecated: false,
          },
          {
            name: 'FOR_HERE',
            isDeprecated: false,
          },
          {
            name: 'TO_GO',
            isDeprecated: false,
          },
          {
            name: 'DIGITAL',
            isDeprecated: false,
          },
          {
            name: 'PURCHASE',
            isDeprecated: false,
          },
          {
            name: 'GENERAL_CONTAINER',
            isDeprecated: false,
          },
          {
            name: 'QUICK_STAY',
            isDeprecated: false,
          },
          {
            name: 'REGULAR_STAY',
            isDeprecated: false,
          },
          {
            name: 'NON_LODGING_NRR',
            isDeprecated: false,
          },
          {
            name: 'NON_LODGING_SALE',
            isDeprecated: false,
          },
          {
            name: 'GIFT_CARD',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'ENUM',
        name: 'LineItemModeInput',
        enumValues: [
          {
            name: 'NONE',
            isDeprecated: false,
          },
          {
            name: 'PICKUP',
            isDeprecated: false,
          },
          {
            name: 'SHIP',
            isDeprecated: false,
          },
          {
            name: 'CURBSIDE',
            isDeprecated: false,
          },
          {
            name: 'DELIVERY',
            isDeprecated: false,
          },
          {
            name: 'DRIVE_THRU',
            isDeprecated: false,
          },
          {
            name: 'FOR_HERE',
            isDeprecated: false,
          },
          {
            name: 'TO_GO',
            isDeprecated: false,
          },
          {
            name: 'DIGITAL',
            isDeprecated: false,
          },
          {
            name: 'PURCHASE',
            isDeprecated: false,
          },
          {
            name: 'GENERAL_CONTAINER',
            isDeprecated: false,
          },
          {
            name: 'QUICK_STAY',
            isDeprecated: false,
          },
          {
            name: 'REGULAR_STAY',
            isDeprecated: false,
          },
          {
            name: 'NON_LODGING_NRR',
            isDeprecated: false,
          },
          {
            name: 'NON_LODGING_SALE',
            isDeprecated: false,
          },
          {
            name: 'GIFT_CARD',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'ENUM',
        name: 'LineItemStatusInput',
        enumValues: [
          {
            name: 'UNFULFILLED',
            isDeprecated: false,
          },
          {
            name: 'ON_HOLD',
            isDeprecated: false,
          },
          {
            name: 'IN_PROGRESS',
            isDeprecated: false,
          },
          {
            name: 'CONFIRMED',
            isDeprecated: false,
          },
          {
            name: 'AWAITING',
            isDeprecated: false,
          },
          {
            name: 'PARTIALLY_FULFILLED',
            isDeprecated: false,
          },
          {
            name: 'FULFILLED',
            isDeprecated: false,
          },
          {
            name: 'PARTIALLY_RETURNED',
            isDeprecated: false,
          },
          {
            name: 'RETURNED',
            isDeprecated: false,
          },
          {
            name: 'CANCELED',
            isDeprecated: false,
          },
          {
            name: 'DRAFT',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'OBJECT',
        name: 'LineItemTotals',
        fields: [
          {
            name: 'discountTotal',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'feeTotal',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'subTotal',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'taxTotal',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'ENUM',
        name: 'LineItemTypes',
        enumValues: [
          {
            name: 'PHYSICAL',
            isDeprecated: false,
          },
          {
            name: 'DIGITAL',
            isDeprecated: false,
          },
          {
            name: 'ALL',
            isDeprecated: false,
          },
          {
            name: 'SERVICE',
            isDeprecated: false,
          },
          {
            name: 'STAY',
            isDeprecated: false,
          },
          {
            name: 'PAY_LINK',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'ENUM',
        name: 'LineItemTypesInput',
        enumValues: [
          {
            name: 'PHYSICAL',
            isDeprecated: false,
          },
          {
            name: 'DIGITAL',
            isDeprecated: false,
          },
          {
            name: 'ALL',
            isDeprecated: false,
          },
          {
            name: 'SERVICE',
            isDeprecated: false,
          },
          {
            name: 'STAY',
            isDeprecated: false,
          },
          {
            name: 'PAY_LINK',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'OBJECT',
        name: 'Links',
        fields: [
          {
            name: 'href',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'method',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'rel',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'submissionMediaType',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'submissionSchema',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'targetMediaType',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'targetSchema',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'title',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'ENUM',
        name: 'MetafieldType',
        enumValues: [
          {
            name: 'JSON',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'ENUM',
        name: 'MetafieldTypeInput',
        enumValues: [
          {
            name: 'JSON',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'OBJECT',
        name: 'Money',
        fields: [
          {
            name: 'currencyCode',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'value',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Int',
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'MoneyInput',
        inputFields: [
          {
            name: 'currencyCode',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'value',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Int',
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'Mutation',
        fields: [
          {
            name: 'addDraftOrder',
            type: {
              kind: 'OBJECT',
              name: 'Order',
            },
            args: [
              {
                name: 'input',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'INPUT_OBJECT',
                    name: 'AddDraftOrderInput',
                  },
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'addLineItemBySkuId',
            type: {
              kind: 'OBJECT',
              name: 'LineItem',
            },
            args: [
              {
                name: 'input',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'INPUT_OBJECT',
                    name: 'AddLineItemInput',
                  },
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'applyDiscountCodes',
            type: {
              kind: 'OBJECT',
              name: 'Order',
            },
            args: [
              {
                name: 'input',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'INPUT_OBJECT',
                    name: 'ApplyDiscountCodesInput',
                  },
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'deleteLineItemById',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [
              {
                name: 'id',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'ID',
                  },
                },
              },
              {
                name: 'orderId',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'ID',
                  },
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'updateDraftOrder',
            type: {
              kind: 'OBJECT',
              name: 'Order',
            },
            args: [
              {
                name: 'input',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'INPUT_OBJECT',
                    name: 'UpdateDraftOrderInput',
                  },
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'updateLineItemById',
            type: {
              kind: 'OBJECT',
              name: 'LineItem',
            },
            args: [
              {
                name: 'input',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'INPUT_OBJECT',
                    name: 'UpdateLineItemByIdInput',
                  },
                },
              },
            ],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INTERFACE',
        name: 'Node',
        fields: [
          {
            name: 'id',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'ID',
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
        possibleTypes: [
          {
            kind: 'OBJECT',
            name: 'LineItem',
          },
          {
            kind: 'OBJECT',
            name: 'Order',
          },
        ],
      },
      {
        kind: 'OBJECT',
        name: 'Note',
        fields: [
          {
            name: 'author',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'authorType',
            type: {
              kind: 'ENUM',
              name: 'NoteAuthorType',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'content',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'deletedAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'externalIds',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'OrderMetafield',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'shouldNotifyCustomer',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'ENUM',
        name: 'NoteAuthorType',
        enumValues: [
          {
            name: 'MERCHANT',
            isDeprecated: false,
          },
          {
            name: 'CUSTOMER',
            isDeprecated: false,
          },
          {
            name: 'NONE',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'ENUM',
        name: 'NoteAuthorTypeInput',
        enumValues: [
          {
            name: 'MERCHANT',
            isDeprecated: false,
          },
          {
            name: 'CUSTOMER',
            isDeprecated: false,
          },
          {
            name: 'NONE',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'NoteInput',
        inputFields: [
          {
            name: 'author',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'authorType',
            type: {
              kind: 'ENUM',
              name: 'NoteAuthorTypeInput',
            },
          },
          {
            name: 'content',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'createdAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'Order',
        fields: [
          {
            name: 'context',
            type: {
              kind: 'OBJECT',
              name: 'Context',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'customerId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'discounts',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'Discount',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'fees',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'Fee',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'id',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'ID',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'lineItems',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'LineItem',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'links',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'Links',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'OrderMetafield',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'notes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'Note',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'shipping',
            type: {
              kind: 'OBJECT',
              name: 'ShippingInfo',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'tags',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'taxExempted',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'taxes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'OrderTax',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totals',
            type: {
              kind: 'OBJECT',
              name: 'OrderTotals',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [
          {
            kind: 'INTERFACE',
            name: 'Node',
          },
        ],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OrderAddressInput',
        inputFields: [
          {
            name: 'addressLine1',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'addressLine2',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'addressLine3',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'adminArea4',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'adminArea3',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'adminArea2',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'adminArea1',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'postalCode',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'countryCode',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OrderBillingInfoInput',
        inputFields: [
          {
            name: 'address',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'OrderAddressInput',
            },
          },
          {
            name: 'firstName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'lastName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'phone',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'email',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'companyName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OrderContextInput',
        inputFields: [
          {
            name: 'channelId',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'storeId',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OrderContextInputUpdate',
        inputFields: [
          {
            name: 'channelId',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'storeId',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'OrderMetafield',
        fields: [
          {
            name: 'key',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'type',
            type: {
              kind: 'ENUM',
              name: 'MetafieldType',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'value',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OrderMetafieldInput',
        inputFields: [
          {
            name: 'key',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'value',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'type',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'ENUM',
                name: 'MetafieldTypeInput',
              },
            },
            defaultValue: 'JSON',
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OrderShippingInfoInput',
        inputFields: [
          {
            name: 'address',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'OrderAddressInput',
            },
          },
          {
            name: 'firstName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'lastName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'phone',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'email',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'companyName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'OrderTax',
        fields: [
          {
            name: 'additional',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'amount',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'exempted',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'externalIds',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'included',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'OrderMetafield',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: true,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OrderTaxInput',
        inputFields: [
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'included',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
          },
          {
            name: 'exempted',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
          {
            name: 'additional',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'OrderTotals',
        fields: [
          {
            name: 'discountTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'Money',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'feeTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'Money',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'productDiscountTotal',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'shippingDiscountTotal',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'shippingTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'Money',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'subTotal',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'taxTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'Money',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'total',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'Money',
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OrderTotalsInput',
        inputFields: [
          {
            name: 'subTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'shippingTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'productDiscountTotal',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'MoneyInput',
            },
          },
          {
            name: 'shippingDiscountTotal',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'MoneyInput',
            },
          },
          {
            name: 'discountTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'feeTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'taxTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'total',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'Query',
        fields: [
          {
            name: 'orderById',
            type: {
              kind: 'OBJECT',
              name: 'Order',
            },
            args: [
              {
                name: 'id',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'ID',
                  },
                },
              },
            ],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SelectedAddon',
        fields: [
          {
            name: 'attribute',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'sku',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'values',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'SelectedAddonValue',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SelectedAddonInput',
        inputFields: [
          {
            name: 'attribute',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'sku',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'values',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'LIST',
                ofType: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'INPUT_OBJECT',
                    name: 'SelectedAddonValueInput',
                  },
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'SelectedAddonValue',
        fields: [
          {
            name: 'amount',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'amountIncreased',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'costAdjustment',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SelectedAddonValueInput',
        inputFields: [
          {
            name: 'name',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'MoneyInput',
            },
          },
          {
            name: 'amountIncreased',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
          },
          {
            name: 'costAdjustment',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'SelectedOption',
        fields: [
          {
            name: 'attribute',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'values',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SelectedOptionInput',
        inputFields: [
          {
            name: 'attribute',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'values',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'LIST',
                ofType: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'String',
                  },
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'ShippingInfo',
        fields: [
          {
            name: 'address',
            type: {
              kind: 'OBJECT',
              name: 'AddressV2',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'companyName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'email',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'firstName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'lastName',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'phone',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ShippingLineInput',
        inputFields: [
          {
            name: 'amount',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'name',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'totals',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'ShippingLineTotalsInput',
              },
            },
          },
          {
            name: 'requestedProvider',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'requestedService',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'taxes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'TaxInput',
                },
              },
            },
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
          {
            name: 'discounts',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'DiscountInput',
                },
              },
            },
          },
          {
            name: 'fees',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'FeeInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ShippingLineTotalsInput',
        inputFields: [
          {
            name: 'taxTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'subTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'SCALAR',
        name: 'String',
      },
      {
        kind: 'OBJECT',
        name: 'Tax',
        fields: [
          {
            name: 'amount',
            type: {
              kind: 'OBJECT',
              name: 'Money',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'exempted',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'externalIds',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'included',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'OrderMetafield',
                },
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: true,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'TaxInput',
        inputFields: [
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'included',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
          },
          {
            name: 'exempted',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'TotalsInput',
        inputFields: [
          {
            name: 'discountTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'feeTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'taxTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
          {
            name: 'subTotal',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'MoneyInput',
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateDiscountInput',
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'UpdateMoneyInput',
            },
          },
          {
            name: 'code',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'appliedBeforeTax',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateDraftLineItemInput',
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'externalId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'fulfillmentChannelId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'type',
            type: {
              kind: 'ENUM',
              name: 'LineItemTypesInput',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'fulfillmentMode',
            type: {
              kind: 'ENUM',
              name: 'LineItemModeInput',
            },
          },
          {
            name: 'totals',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'TotalsInput',
            },
          },
          {
            name: 'quantity',
            type: {
              kind: 'SCALAR',
              name: 'Float',
            },
          },
          {
            name: 'notes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'NoteInput',
                },
              },
            },
            defaultValue: '[]',
          },
          {
            name: 'skuId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'shipping',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'LineItemInputShippingInfo',
            },
          },
          {
            name: 'details',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'LineItemInputDetailsInfo',
            },
          },
          {
            name: 'tags',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            },
          },
          {
            name: 'serviceStartAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
          },
          {
            name: 'serviceEndsAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
          },
          {
            name: 'discounts',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'DiscountInput',
                },
              },
            },
          },
          {
            name: 'fees',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'FeeInput',
                },
              },
            },
          },
          {
            name: 'taxes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'TaxInput',
                },
              },
            },
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateDraftOrderInput',
        inputFields: [
          {
            name: 'context',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'INPUT_OBJECT',
                name: 'OrderContextInputUpdate',
              },
            },
          },
          {
            name: 'totals',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'OrderTotalsInput',
            },
          },
          {
            name: 'customerId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'billing',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'OrderBillingInfoInput',
            },
          },
          {
            name: 'shipping',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'OrderShippingInfoInput',
            },
          },
          {
            name: 'lineItems',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'UpdateDraftOrderLineItemsInput',
            },
          },
          {
            name: 'shippingLines',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdateShippingLineInput',
                },
              },
            },
          },
          {
            name: 'discounts',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdateDiscountInput',
                },
              },
            },
          },
          {
            name: 'fees',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdateFeeInput',
                },
              },
            },
          },
          {
            name: 'taxes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdateOrderTaxInput',
                },
              },
            },
          },
          {
            name: 'notes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdateNoteInput',
                },
              },
            },
          },
          {
            name: 'tags',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            },
          },
          {
            name: 'id',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'ID',
              },
            },
          },
          {
            name: 'externalId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'cartId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateDraftOrderLineItemsInput',
        inputFields: [
          {
            name: 'add',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreateDraftLineItemInput',
                },
              },
            },
          },
          {
            name: 'update',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdateDraftLineItemInput',
                },
              },
            },
          },
          {
            name: 'remove',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateFeeInput',
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'UpdateMoneyInput',
            },
          },
          {
            name: 'appliedBeforeTax',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateLineItemByIdInput',
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'ID',
              },
            },
          },
          {
            name: 'externalId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'fulfillmentChannelId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'type',
            type: {
              kind: 'ENUM',
              name: 'LineItemTypesInput',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'fulfillmentMode',
            type: {
              kind: 'ENUM',
              name: 'LineItemModeInput',
            },
          },
          {
            name: 'totals',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'TotalsInput',
            },
          },
          {
            name: 'quantity',
            type: {
              kind: 'SCALAR',
              name: 'Float',
            },
          },
          {
            name: 'notes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'NoteInput',
                },
              },
            },
            defaultValue: '[]',
          },
          {
            name: 'skuId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'shipping',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'LineItemInputShippingInfo',
            },
          },
          {
            name: 'details',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'LineItemInputDetailsInfo',
            },
          },
          {
            name: 'tags',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            },
          },
          {
            name: 'serviceStartAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
          },
          {
            name: 'serviceEndsAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
          },
          {
            name: 'discounts',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'DiscountInput',
                },
              },
            },
          },
          {
            name: 'fees',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'FeeInput',
                },
              },
            },
          },
          {
            name: 'taxes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'TaxInput',
                },
              },
            },
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'orderId',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'ID',
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateMoneyInput',
        inputFields: [
          {
            name: 'currencyCode',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'value',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateNoteInput',
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'author',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'authorType',
            type: {
              kind: 'ENUM',
              name: 'NoteAuthorTypeInput',
            },
          },
          {
            name: 'content',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'String',
              },
            },
          },
          {
            name: 'createdAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
          },
          {
            name: 'deletedAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateOrderTaxInput',
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'UpdateMoneyInput',
            },
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'included',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
          },
          {
            name: 'exempted',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
          {
            name: 'additional',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateShippingLineInput',
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'UpdateMoneyInput',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'totals',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'UpdateShippingLineTotalsInput',
            },
          },
          {
            name: 'requestedProvider',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'requestedService',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'taxes',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdateTaxInput',
                },
              },
            },
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
          {
            name: 'discounts',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdateDiscountInput',
                },
              },
            },
          },
          {
            name: 'fees',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdateFeeInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateShippingLineTotalsInput',
        inputFields: [
          {
            name: 'taxTotal',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'UpdateMoneyInput',
            },
          },
          {
            name: 'subTotal',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'UpdateMoneyInput',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdateTaxInput',
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'referenceId',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'amount',
            type: {
              kind: 'INPUT_OBJECT',
              name: 'UpdateMoneyInput',
            },
          },
          {
            name: 'ratePercentage',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'included',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
          },
          {
            name: 'exempted',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
            },
            defaultValue: 'false',
          },
          {
            name: 'metafields',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'OrderMetafieldInput',
                },
              },
            },
          },
          {
            name: 'externalIds',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'INPUT_OBJECT',
                  name: 'ExternalIdsInput',
                },
              },
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'externalIds',
        fields: [
          {
            name: 'type',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'value',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
    ],
    directives: [],
  },
} as const;

export { introspection };
