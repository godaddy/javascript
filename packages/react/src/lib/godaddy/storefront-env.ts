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
  name: 'storefront-api',
  __schema: {
    queryType: {
      name: 'Query',
    },
    mutationType: null,
    subscriptionType: null,
    types: [
      {
        kind: 'OBJECT',
        name: 'Attribute',
        fields: [
          {
            name: 'HTMLDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'SKUGroup',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'description',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'htmlDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'AttributeMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
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
            args: [],
            isDeprecated: false,
          },
          {
            name: 'position',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'skuGroup',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'values',
            type: {
              kind: 'OBJECT',
              name: 'AttributeValuesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeValueIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeValueOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'skuId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUIdFilter',
                },
              },
            ],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'AttributeIdFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'AttributeIdsFilter',
        inputFields: [
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'AttributeMetafieldsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'AttributeMetafieldsEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'AttributeMetafieldsEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Metafield',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'AttributeOrderBy',
        inputFields: [
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'label',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'position',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'skuGroupId',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'AttributeValue',
        fields: [
          {
            name: 'attribute',
            type: {
              kind: 'OBJECT',
              name: 'Attribute',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'AttributeValueMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
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
            args: [],
            isDeprecated: false,
          },
          {
            name: 'position',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
        name: 'AttributeValueIdsFilter',
        inputFields: [
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'AttributeValueMetafieldsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'AttributeValueMetafieldsEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'AttributeValueMetafieldsEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Metafield',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'AttributeValueOrderBy',
        inputFields: [
          {
            name: 'attributeId',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'position',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'AttributeValuesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'AttributeValuesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'AttributeValuesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'AttributeValue',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'SCALAR',
        name: 'Boolean',
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'CreatedAtFilter',
        inputFields: [
          {
            name: 'gt',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'lt',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
        name: 'InventoryCount',
        fields: [
          {
            name: 'SKU',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
            name: 'quantity',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'sku',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'type',
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
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
        name: 'InventoryCountIdsFilter',
        inputFields: [
          {
            name: 'in',
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
        name: 'InventoryCountOrderBy',
        inputFields: [
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'InventoryCountTypeFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'LabelFilter',
        inputFields: [
          {
            name: 'contains',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'eq',
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
        name: 'List',
        fields: [
          {
            name: 'HTMLDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'SKUGroups',
            type: {
              kind: 'OBJECT',
              name: 'ListSKUGroupsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: true,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'description',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'htmlDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'mediaObjects',
            type: {
              kind: 'OBJECT',
              name: 'ListMediaObjectsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'ListMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
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
            args: [],
            isDeprecated: false,
          },
          {
            name: 'references',
            type: {
              kind: 'OBJECT',
              name: 'ListReferencesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'origin',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceOriginFilter',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'skuGroups',
            type: {
              kind: 'OBJECT',
              name: 'ListSkuGroupsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'status',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
        name: 'ListIdFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'ListIdsFilter',
        inputFields: [
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'ListMediaObjectsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListMediaObjectsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListMediaObjectsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Media',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'ListMetafieldsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListMetafieldsEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListMetafieldsEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Metafield',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'ListOption',
        fields: [
          {
            name: 'compareAtPriceRange',
            type: {
              kind: 'OBJECT',
              name: 'PriceRange',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'description',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'OptionMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
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
            args: [],
            isDeprecated: false,
          },
          {
            name: 'position',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'priceRange',
            type: {
              kind: 'OBJECT',
              name: 'PriceRange',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'prices',
            type: {
              kind: 'OBJECT',
              name: 'ListOptionPricesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'skuGroupId',
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
            name: 'type',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'validation',
            type: {
              kind: 'OBJECT',
              name: 'OptionValidation',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'values',
            type: {
              kind: 'OBJECT',
              name: 'ListOptionValuesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'OptionValueIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'OptionValueOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
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
        name: 'ListOptionPricesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListOptionPricesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListOptionPricesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'OptionPrice',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'ListOptionValuesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListOptionValuesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListOptionValuesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'OptionValue',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ListOrderBy',
        inputFields: [
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'label',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'ListReferencesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListReferencesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListReferencesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Reference',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'ListSKUGroupsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListSKUGroupsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListSKUGroupsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'ListSkuGroupsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListSkuGroupsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListSkuGroupsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ListStatusFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'ListTree',
        fields: [
          {
            name: 'HTMLDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'activatedAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'archivedAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
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
            name: 'description',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'htmlDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'listTreeNodes',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeListTreeNodesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'hasParent',
                type: {
                  kind: 'SCALAR',
                  name: 'Boolean',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'listId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListIdFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeNodeOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'parentNodeId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeNodeParentNodeIdFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
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
            name: 'references',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeReferencesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'origin',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceOriginFilter',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'status',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ListTreeIdFilter',
        inputFields: [
          {
            name: 'eq',
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
        name: 'ListTreeIdsFilter',
        inputFields: [
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'ListTreeListTreeNodesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListTreeListTreeNodesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListTreeListTreeNodesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeNode',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'ListTreeMetafieldsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListTreeMetafieldsEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListTreeMetafieldsEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Metafield',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'ListTreeNode',
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
            name: 'id',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'list',
            type: {
              kind: 'OBJECT',
              name: 'List',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'listTree',
            type: {
              kind: 'OBJECT',
              name: 'ListTree',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'listTreeNodes',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeNodeListTreeNodesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeNodeOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'parentListTreeNode',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeNode',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'position',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'references',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeNodeReferencesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'origin',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceOriginFilter',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
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
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ListTreeNodeIdsFilter',
        inputFields: [
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'ListTreeNodeListTreeNodesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListTreeNodeListTreeNodesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListTreeNodeListTreeNodesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeNode',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ListTreeNodeOrderBy',
        inputFields: [
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'position',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ListTreeNodeParentNodeIdFilter',
        inputFields: [
          {
            name: 'eq',
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
        name: 'ListTreeNodeReferencesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListTreeNodeReferencesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListTreeNodeReferencesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Reference',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ListTreeOrderBy',
        inputFields: [
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'ListTreeReferencesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'ListTreeReferencesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'ListTreeReferencesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Reference',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'ListTreeStatusFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'LocationIdFilter',
        inputFields: [
          {
            name: 'eq',
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
        name: 'Media',
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
          {
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'MediaMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
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
            name: 'position',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
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
            name: 'url',
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
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'MediaMetafieldsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'MediaMetafieldsEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'MediaMetafieldsEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Metafield',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'Metafield',
        fields: [
          {
            name: 'createdAt',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
            name: 'key',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'namespace',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'resourceId',
            type: {
              kind: 'SCALAR',
              name: 'ID',
            },
            args: [],
            isDeprecated: false,
          },
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
            name: 'updatedAt',
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
      {
        kind: 'INPUT_OBJECT',
        name: 'NameFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'NumericOption',
        fields: [
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'description',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'OptionMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
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
            args: [],
            isDeprecated: false,
          },
          {
            name: 'position',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'prices',
            type: {
              kind: 'OBJECT',
              name: 'NumericOptionPricesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'skuGroupId',
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
            name: 'type',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'validation',
            type: {
              kind: 'OBJECT',
              name: 'OptionValidation',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'NumericOptionPricesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'NumericOptionPricesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'NumericOptionPricesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'OptionPrice',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'UNION',
        name: 'Option',
        possibleTypes: [
          {
            kind: 'OBJECT',
            name: 'ListOption',
          },
          {
            kind: 'OBJECT',
            name: 'NumericOption',
          },
          {
            kind: 'OBJECT',
            name: 'TextOption',
          },
        ],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OptionIdFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'OptionIdsFilter',
        inputFields: [
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'OptionMetafieldsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'OptionMetafieldsEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'OptionMetafieldsEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Metafield',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OptionOrderBy',
        inputFields: [
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'label',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'position',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'price',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'OptionPrice',
        fields: [
          {
            name: 'compareAtValue',
            type: {
              kind: 'OBJECT',
              name: 'SimpleMoney',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
                kind: 'OBJECT',
                name: 'SimpleMoney',
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'OptionValidation',
        fields: [
          {
            name: 'max',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'min',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'OptionValue',
        fields: [
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'OptionValueMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
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
            args: [],
            isDeprecated: false,
          },
          {
            name: 'option',
            type: {
              kind: 'OBJECT',
              name: 'ListOption',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'position',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'prices',
            type: {
              kind: 'OBJECT',
              name: 'OptionValuePricesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
        name: 'OptionValueIdsFilter',
        inputFields: [
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'OptionValueMetafieldsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'OptionValueMetafieldsEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'OptionValueMetafieldsEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Metafield',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'OptionValueOrderBy',
        inputFields: [
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'position',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'price',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'OptionValuePrice',
        fields: [
          {
            name: 'compareAtValue',
            type: {
              kind: 'OBJECT',
              name: 'SimpleMoney',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
                kind: 'OBJECT',
                name: 'SimpleMoney',
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'OptionValuePricesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'OptionValuePricesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'OptionValuePricesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'OptionValuePrice',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'ENUM',
        name: 'OrderByDirectionEnum',
        enumValues: [
          {
            name: 'ASC',
            isDeprecated: false,
          },
          {
            name: 'DESC',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'OBJECT',
        name: 'PageInfo',
        fields: [
          {
            name: 'endCursor',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'hasNextPage',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Boolean',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'hasPreviousPage',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Boolean',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'startCursor',
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
        name: 'PaginationType',
        enumValues: [
          {
            name: 'CURSOR',
            isDeprecated: false,
          },
          {
            name: 'OFFSET',
            isDeprecated: false,
          },
        ],
      },
      {
        kind: 'OBJECT',
        name: 'PriceRange',
        fields: [
          {
            name: 'max',
            type: {
              kind: 'SCALAR',
              name: 'Float',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'min',
            type: {
              kind: 'SCALAR',
              name: 'Float',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'Query',
        fields: [
          {
            name: 'SKU',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [
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
            ],
            isDeprecated: true,
          },
          {
            name: 'SKUGroup',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [
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
            ],
            isDeprecated: true,
          },
          {
            name: 'SKUGroups',
            type: {
              kind: 'OBJECT',
              name: 'QuerySKUGroupsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'channelId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupChannelIdFilter',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'listId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListIdFilter',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'referenceValue',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceValueFilter',
                },
              },
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupStatusFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: true,
          },
          {
            name: 'SKUs',
            type: {
              kind: 'OBJECT',
              name: 'QuerySKUsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'attributeValues',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUAttributeValueFilter',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'locationId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'LocationIdFilter',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'referenceValue',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceValueFilter',
                },
              },
              {
                name: 'skuGroupId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupIdFilter',
                },
              },
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUStatusFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: true,
          },
          {
            name: 'attribute',
            type: {
              kind: 'OBJECT',
              name: 'Attribute',
            },
            args: [
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
            ],
            isDeprecated: false,
          },
          {
            name: 'attributeValue',
            type: {
              kind: 'OBJECT',
              name: 'AttributeValue',
            },
            args: [
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
            ],
            isDeprecated: false,
          },
          {
            name: 'attributeValues',
            type: {
              kind: 'OBJECT',
              name: 'QueryAttributeValuesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'attributeId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeIdFilter',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeValueIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeValueOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'skuId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUIdFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'attributes',
            type: {
              kind: 'OBJECT',
              name: 'QueryAttributesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'skuGroupId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupIdFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'categoriesListTree',
            type: {
              kind: 'OBJECT',
              name: 'ListTree',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'inventoryCount',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'InventoryCount',
                },
              },
            },
            args: [
              {
                name: 'locationId',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'String',
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
                name: 'type',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'inventoryCounts',
            type: {
              kind: 'OBJECT',
              name: 'QueryInventoryCountsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'InventoryCountIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'locationId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'LocationIdFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'InventoryCountOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'skuId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUIdFilter',
                },
              },
              {
                name: 'type',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'InventoryCountTypeFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'list',
            type: {
              kind: 'OBJECT',
              name: 'List',
            },
            args: [
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
            ],
            isDeprecated: false,
          },
          {
            name: 'listTree',
            type: {
              kind: 'OBJECT',
              name: 'ListTree',
            },
            args: [
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
            ],
            isDeprecated: false,
          },
          {
            name: 'listTreeNode',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeNode',
            },
            args: [
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
            ],
            isDeprecated: false,
          },
          {
            name: 'listTreeNodes',
            type: {
              kind: 'OBJECT',
              name: 'QueryListTreeNodesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'hasParent',
                type: {
                  kind: 'SCALAR',
                  name: 'Boolean',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeNodeIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'listId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListIdFilter',
                },
              },
              {
                name: 'listTreeId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeIdFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeNodeOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'parentNodeId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeNodeParentNodeIdFilter',
                },
              },
              {
                name: 'referenceValue',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceValueFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'listTrees',
            type: {
              kind: 'OBJECT',
              name: 'QueryListTreesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'referenceValue',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceValueFilter',
                },
              },
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListTreeStatusFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'lists',
            type: {
              kind: 'OBJECT',
              name: 'QueryListsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'referenceValue',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceValueFilter',
                },
              },
              {
                name: 'skuGroupId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupIdFilter',
                },
              },
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListStatusFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'optionValues',
            type: {
              kind: 'OBJECT',
              name: 'QueryOptionValuesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'OptionValueIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'optionId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'OptionIdFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'OptionValueOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'options',
            type: {
              kind: 'OBJECT',
              name: 'QueryOptionsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'OptionIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'OptionOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'skuGroupId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupIdFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'sku',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [
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
            ],
            isDeprecated: false,
          },
          {
            name: 'skuGroup',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [
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
            ],
            isDeprecated: false,
          },
          {
            name: 'skuGroups',
            type: {
              kind: 'OBJECT',
              name: 'QuerySkuGroupsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'channelId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupChannelIdFilter',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupIdsFilter',
                },
              },
              {
                name: 'label',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'LabelFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'listId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListIdFilter',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'referenceValue',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceValueFilter',
                },
              },
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupStatusFilter',
                },
              },
              {
                name: 'type',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupTypeFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'skus',
            type: {
              kind: 'OBJECT',
              name: 'QuerySkusConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'attributeValues',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUAttributeValueFilter',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'code',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUCodeFilter',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'eanCode',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUEanCodeFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'gtinCode',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGtinCodeFilter',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUIdsFilter',
                },
              },
              {
                name: 'isbnCode',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUIsbnCodeFilter',
                },
              },
              {
                name: 'label',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'LabelFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'locationId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'LocationIdFilter',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'queryFilter',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'referenceValue',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceValueFilter',
                },
              },
              {
                name: 'skuGroupId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGroupIdFilter',
                },
              },
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUStatusFilter',
                },
              },
              {
                name: 'upcCode',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUUpcCodeFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
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
        name: 'QueryAttributeValuesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QueryAttributeValuesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QueryAttributeValuesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'AttributeValue',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QueryAttributesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QueryAttributesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QueryAttributesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Attribute',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QueryInventoryCountsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QueryInventoryCountsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QueryInventoryCountsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'InventoryCount',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QueryListTreeNodesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QueryListTreeNodesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QueryListTreeNodesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'ListTreeNode',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QueryListTreesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QueryListTreesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QueryListTreesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'ListTree',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QueryListsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QueryListsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QueryListsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'List',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QueryOptionValuesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QueryOptionValuesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QueryOptionValuesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'OptionValue',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QueryOptionsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QueryOptionsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QueryOptionsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'UNION',
              name: 'Option',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QuerySKUGroupsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QuerySKUGroupsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QuerySKUGroupsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QuerySKUsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QuerySKUsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QuerySKUsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QuerySkuGroupsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QuerySkuGroupsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QuerySkuGroupsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'QuerySkusConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'QuerySkusConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'QuerySkusConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'Reference',
        fields: [
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
            name: 'origin',
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
      {
        kind: 'INPUT_OBJECT',
        name: 'ReferenceOriginFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'ReferenceValueFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'SKU',
        fields: [
          {
            name: 'HTMLDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'SKUGroup',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'archivedAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'attributeValues',
            type: {
              kind: 'OBJECT',
              name: 'SKUAttributeValuesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeValueOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'attributes',
            type: {
              kind: 'OBJECT',
              name: 'SKUAttributesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'code',
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
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'description',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'eanCode',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'gtinCode',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'htmlDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
            name: 'inventoryCounts',
            type: {
              kind: 'OBJECT',
              name: 'SKUInventoryCountsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'InventoryCountOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'isbnCode',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'mediaObjects',
            type: {
              kind: 'OBJECT',
              name: 'SKUMediaObjectsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'SKUMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
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
            args: [],
            isDeprecated: false,
          },
          {
            name: 'prices',
            type: {
              kind: 'OBJECT',
              name: 'SKUPricesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'references',
            type: {
              kind: 'OBJECT',
              name: 'SKUReferencesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'origin',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceOriginFilter',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'shortLabel',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'skuGroup',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroup',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'unitOfWeight',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'upcCode',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'weight',
            type: {
              kind: 'SCALAR',
              name: 'Float',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SKUAttributeValueFilter',
        inputFields: [
          {
            name: 'has',
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
        kind: 'OBJECT',
        name: 'SKUAttributeValuesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUAttributeValuesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUAttributeValuesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'AttributeValue',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUAttributesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUAttributesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUAttributesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Attribute',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SKUCodeFilter',
        inputFields: [
          {
            name: 'contains',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'SKUEanCodeFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'SKUGroup',
        fields: [
          {
            name: 'HTMLDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'SKUs',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroupSKUsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'attributeValues',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUAttributeValueFilter',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'label',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'LabelFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'locationId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'LocationIdFilter',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'queryFilter',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'referenceValue',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceValueFilter',
                },
              },
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUStatusFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: true,
          },
          {
            name: 'activatedAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'archivedAt',
            type: {
              kind: 'SCALAR',
              name: 'DateTime',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'attributes',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroupAttributesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeIdsFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'AttributeOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'compareAtPriceRange',
            type: {
              kind: 'OBJECT',
              name: 'PriceRange',
            },
            args: [
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUStatusFilter',
                },
                defaultValue: '{in: ["ACTIVE", "DRAFT"]}',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'description',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'htmlDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'lists',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroupListsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'id',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListIdFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ListOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'mediaObjects',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroupMediaObjectsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroupMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
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
            args: [],
            isDeprecated: false,
          },
          {
            name: 'options',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroupOptionsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'OptionOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'priceRange',
            type: {
              kind: 'OBJECT',
              name: 'PriceRange',
            },
            args: [
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUStatusFilter',
                },
                defaultValue: '{in: ["ACTIVE", "DRAFT"]}',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'references',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroupReferencesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'origin',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceOriginFilter',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'shortLabel',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'skus',
            type: {
              kind: 'OBJECT',
              name: 'SKUGroupSkusConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'attributeValues',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUAttributeValueFilter',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'code',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUCodeFilter',
                },
              },
              {
                name: 'createdAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'CreatedAtFilter',
                },
              },
              {
                name: 'eanCode',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUEanCodeFilter',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'gtinCode',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUGtinCodeFilter',
                },
              },
              {
                name: 'isbnCode',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUIsbnCodeFilter',
                },
              },
              {
                name: 'label',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'LabelFilter',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'locationId',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'LocationIdFilter',
                },
              },
              {
                name: 'name',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'NameFilter',
                },
              },
              {
                name: 'orderBy',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUOrderBy',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
              {
                name: 'queryFilter',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'referenceValue',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'ReferenceValueFilter',
                },
              },
              {
                name: 'status',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUStatusFilter',
                },
              },
              {
                name: 'upcCode',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'SKUUpcCodeFilter',
                },
              },
              {
                name: 'updatedAt',
                type: {
                  kind: 'INPUT_OBJECT',
                  name: 'UpdatedAtFilter',
                },
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'type',
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
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUGroupAttributesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUGroupAttributesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUGroupAttributesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Attribute',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SKUGroupChannelIdFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'SKUGroupIdFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'SKUGroupIdsFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'SKUGroupListsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUGroupListsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUGroupListsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'List',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUGroupMediaObjectsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUGroupMediaObjectsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUGroupMediaObjectsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Media',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUGroupMetafieldsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUGroupMetafieldsEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUGroupMetafieldsEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Metafield',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUGroupOptionsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUGroupOptionsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUGroupOptionsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'UNION',
              name: 'Option',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SKUGroupOrderBy',
        inputFields: [
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'label',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'lowestPrice',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'saleCount',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'SKUGroupReferencesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUGroupReferencesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUGroupReferencesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Reference',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUGroupSKUsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUGroupSKUsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUGroupSKUsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUGroupSkusConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUGroupSkusConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUGroupSkusConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SKUGroupStatusFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'SKUGroupTypeFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'SKUGtinCodeFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'SKUIdFilter',
        inputFields: [
          {
            name: 'eq',
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
        name: 'SKUIdsFilter',
        inputFields: [
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'SKUInventoryCountsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUInventoryCountsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUInventoryCountsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'InventoryCount',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SKUIsbnCodeFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'SKUMediaObjectsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUMediaObjectsConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUMediaObjectsConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Media',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUMetafieldsConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUMetafieldsEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUMetafieldsEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Metafield',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SKUOrderBy',
        inputFields: [
          {
            name: 'createdAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'id',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'label',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'name',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'price',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'ENUM',
              name: 'OrderByDirectionEnum',
            },
          },
        ],
        isOneOf: false,
      },
      {
        kind: 'OBJECT',
        name: 'SKUPrice',
        fields: [
          {
            name: 'SKU',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'compareAtValue',
            type: {
              kind: 'OBJECT',
              name: 'SimpleMoney',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
            name: 'sku',
            type: {
              kind: 'OBJECT',
              name: 'SKU',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
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
                kind: 'OBJECT',
                name: 'SimpleMoney',
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUPricesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUPricesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUPricesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'SKUPrice',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'SKUReferencesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'SKUReferencesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'SKUReferencesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'Reference',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'SKUStatusFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        name: 'SKUUpcCodeFilter',
        inputFields: [
          {
            name: 'eq',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'in',
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
        kind: 'OBJECT',
        name: 'SimpleMoney',
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
                name: 'Float',
              },
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'SCALAR',
        name: 'String',
      },
      {
        kind: 'OBJECT',
        name: 'TextOption',
        fields: [
          {
            name: 'HTMLDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: true,
          },
          {
            name: 'createdAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'description',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'htmlDescription',
            type: {
              kind: 'SCALAR',
              name: 'String',
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
            name: 'label',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'metafields',
            type: {
              kind: 'OBJECT',
              name: 'OptionMetafieldsConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'key',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'namespace',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
            ],
            isDeprecated: false,
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
            args: [],
            isDeprecated: false,
          },
          {
            name: 'position',
            type: {
              kind: 'SCALAR',
              name: 'Int',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'prices',
            type: {
              kind: 'OBJECT',
              name: 'TextOptionPricesConnection',
            },
            args: [
              {
                name: 'after',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'before',
                type: {
                  kind: 'SCALAR',
                  name: 'String',
                },
              },
              {
                name: 'first',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'last',
                type: {
                  kind: 'SCALAR',
                  name: 'Int',
                },
              },
              {
                name: 'paginationType',
                type: {
                  kind: 'ENUM',
                  name: 'PaginationType',
                },
                defaultValue: 'CURSOR',
              },
            ],
            isDeprecated: false,
          },
          {
            name: 'skuGroupId',
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
            name: 'type',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'updatedAt',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'DateTime',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'validation',
            type: {
              kind: 'OBJECT',
              name: 'OptionValidation',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'TextOptionPricesConnection',
        fields: [
          {
            name: 'edges',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'OBJECT',
                name: 'TextOptionPricesConnectionEdge',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'pageInfo',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'OBJECT',
                name: 'PageInfo',
              },
            },
            args: [],
            isDeprecated: false,
          },
          {
            name: 'totalCount',
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
        kind: 'OBJECT',
        name: 'TextOptionPricesConnectionEdge',
        fields: [
          {
            name: 'cursor',
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
            name: 'node',
            type: {
              kind: 'OBJECT',
              name: 'OptionPrice',
            },
            args: [],
            isDeprecated: false,
          },
        ],
        interfaces: [],
      },
      {
        kind: 'INPUT_OBJECT',
        name: 'UpdatedAtFilter',
        inputFields: [
          {
            name: 'gt',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
          {
            name: 'lt',
            type: {
              kind: 'SCALAR',
              name: 'String',
            },
          },
        ],
        isOneOf: false,
      },
    ],
    directives: [],
  },
} as const;

export { introspection };
