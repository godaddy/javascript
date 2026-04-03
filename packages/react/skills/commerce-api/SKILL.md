---
name: commerce-api
description: >
  Connect to GoDaddy Commerce Platform GraphQL APIs using OAuth2
  client credentials. Covers authentication via the /v2/oauth2/token
  endpoint, GraphQL schema introspection, and usage of Orders, Catalog,
  Taxes, and Price Adjustments subgraphs. Activate when an agent needs to
  obtain an OAuth token with a client ID and secret, query order-subgraph,
  catalog-subgraph, tax-subgraph, or price-adjustment-subgraph, calculate
  taxes or price adjustments, or discover available schema fields via
  introspection.
type: core
library: "@godaddy/react"
library_version: "1.0.32"
sources:
  - "godaddy/javascript:packages/react/skills/commerce-api/SKILL.md"
---

# GoDaddy Commerce API Connection Guide

## Setup

Connecting to the GoDaddy Commerce Platform requires an OAuth client ID,
client secret, and a store ID (UUID).

**Environments:**

| Environment | API Host              | Token Endpoint                                |
|-------------|-----------------------|-----------------------------------------------|
| ote         | `api.ote-godaddy.com` | `https://api.ote-godaddy.com/v2/oauth2/token` |
| prod        | `api.godaddy.com`     | `https://api.godaddy.com/v2/oauth2/token`     |

**Obtain an OAuth token** using the client credentials grant with form
parameters:

```typescript
async function getAccessToken(env: 'ote' | 'prod' = 'ote'): Promise<string> {
  const host = env === 'prod' ? 'api.godaddy.com' : 'api.ote-godaddy.com';
  const clientId = process.env.OAUTH_CLIENT_ID!;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET!;

  const response = await fetch(`https://${host}/v2/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: 'commerce.product:read commerce.product:write commerce.order:read',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OAuth token request failed: ${response.status} — ${text}`);
  }

  const data = await response.json();
  return data.access_token; // also: data.expires_in (seconds)
}
```

Tokens are short-lived (~1 hour). Cache and refresh before expiry.

**GraphQL subgraph endpoints** — all four APIs share the same host:

| API               | Path                                                        |
|-------------------|-------------------------------------------------------------|
| Orders            | `/v1/commerce/order-subgraph`                               |
| Catalog           | `/v2/commerce/stores/{storeId}/catalog-subgraph`            |
| Taxes             | `/v2/commerce/stores/{storeId}/tax-subgraph`                |
| Price Adjustments | `/v2/commerce/stores/{storeId}/price-adjustment-subgraph`   |

Full URL example (ote): `https://api.ote-godaddy.com/v2/commerce/stores/{storeId}/catalog-subgraph`

**Required headers** for all subgraph requests:

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'x-store-id': storeId,
  'user-agent': 'your-app/1.0.0 (GoDaddy Commerce Platform)',
};
```

**OAuth scopes** are enforced at the operation level, not the endpoint
level. Any valid commerce token can reach any subgraph and introspect its
schema. Specific mutations/queries require the appropriate scope.

| Scope                    | Purpose                          |
|--------------------------|----------------------------------|
| `commerce.product:read`  | Read catalog/SKU data            |
| `commerce.product:write` | Create and update catalog data   |
| `commerce.order:read`    | Read order data                  |

Request only the scopes your application needs. If a scope is not
provisioned for your OAuth app, the token request returns `invalid_scope`.

## Core Patterns

### Introspect a GraphQL Schema

Any valid token can introspect any subgraph to discover available types,
queries, and mutations.

```typescript
async function introspectSchema(endpoint: string, token: string, storeId: string) {
  const query = `{
    __schema {
      queryType { name fields { name description } }
      mutationType { name fields { name description } }
    }
  }`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`, 'Content-Type': 'application/json',
      'x-store-id': storeId, 'user-agent': 'introspection/1.0.0',
    },
    body: JSON.stringify({ query }),
  });
  return (await res.json()).data.__schema;
}

const host = 'api.ote-godaddy.com';
const schema = await introspectSchema(
  `https://${host}/v2/commerce/stores/${storeId}/catalog-subgraph`, token, storeId
);
console.log('Queries:', schema.queryType.fields.map(f => f.name));
console.log('Mutations:', schema.mutationType.fields.map(f => f.name));
```

### Available Queries and Mutations (verified via introspection)

**Orders** — 11 queries, 17 mutations:
- Queries: `orderById`, `orderByNumber`, `orderByExternalId`, `orders`, `ordersByIds`, `filterOrders`, `orderReturns`, `returnsByOrderId`, `previewReturn`
- Key mutations: `addDraftOrder`, `addLineItemBySkuId`, `updateDraftOrder`, `openOrder`, `applyDiscountCodes`, `updateOrder`, `completeOrder`, `cancelOrder`, `refundOrder`

**Catalog** — 29 queries, 110 mutations:
- Queries: `sku`, `skus`, `skuGroup`, `skuGroups`, `attribute`, `attributes`, `list`, `lists`, `locations`, `inventoryCounts`
- Key mutations: `createSku`, `createSkuGroup`, `updateSku`, `addSkusToSkuGroup`, `createList`, `stockInventory`, `adjustInventory`

**Taxes** — 8 queries, 39 mutations:
- Queries: `rate`, `rates`, `classification`, `classifications`, `jurisdiction`, `jurisdictions`, `override`, `overrides`
- Key mutations: `calculateTaxes`, `createRate`, `createClassification`, `createJurisdiction`, `createOverride`

**Price Adjustments** — 8 queries, 36 mutations:
- Queries: `discount`, `discounts`, `discountCode`, `discountCodes`, `fee`, `fees`, `ruleset`, `rulesets`
- Key mutations: `calculateAdjustments`, `createDiscount`, `createDiscountCode`, `createFee`, `createRuleset`

### Query Orders

```typescript
import { GraphQLClient } from 'graphql-request';

const ordersClient = new GraphQLClient(
  `https://api.ote-godaddy.com/v1/commerce/order-subgraph`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Store-ID': storeId,
      'user-agent': 'my-app/1.0.0 (GoDaddy Commerce Platform)',
    },
  }
);

const order = await ordersClient.request(`
  query OrderById($id: ID!) {
    orderById(id: $id) {
      id number numberDisplay
      statuses { status paymentStatus fulfillmentStatus }
      totals {
        subTotal { value currencyCode }
        shippingTotal { value currencyCode }
        taxTotal { value currencyCode }
        discountTotal { value currencyCode }
        total { value currencyCode }
      }
      lineItems { edges { node { id name quantity unitPrice { value currencyCode } } } }
    }
  }
`, { id: orderId });
```

### Query Catalog

```typescript
const catalogClient = new GraphQLClient(
  `https://api.ote-godaddy.com/v2/commerce/stores/${storeId}/catalog-subgraph`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-store-id': storeId,
      'user-agent': 'my-app/1.0.0 (GoDaddy Commerce Platform)',
    },
  }
);

const skus = await catalogClient.request(`
  query GetSkus($first: Int, $after: String) {
    skus(first: $first, after: $after) {
      totalCount
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id name label code status
          prices { edges { node { value { currencyCode value } } } }
        }
      }
    }
  }
`, { first: 20 });
```

### Calculate Taxes (GraphQL)

```typescript
const taxClient = new GraphQLClient(
  `https://api.ote-godaddy.com/v2/commerce/stores/${storeId}/tax-subgraph`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-store-id': storeId,
      'user-agent': 'my-app/1.0.0 (GoDaddy Commerce Platform)',
    },
  }
);

const taxes = await taxClient.request(`
  mutation CalculateTaxes($input: CalculateTaxesInput!) {
    calculateTaxes(input: $input) {
      totalTaxAmount { value currencyCode }
      taxAmounts { totalTaxAmount { value currencyCode } rate { name label } }
      lines { calculationLine { id } totalTaxAmount { value currencyCode } }
    }
  }
`, {
  input: {
    destination: {
      address: { postalCode: '85001', countryCode: 'US', adminArea1: 'AZ' },
    },
    lines: [
      { id: 'line-1', type: 'SKU', quantity: 1,
        subtotalPrice: { value: 1999, currencyCode: 'USD' } },
    ],
  },
});
```

### Calculate Price Adjustments (GraphQL)

```typescript
const adjustClient = new GraphQLClient(
  `https://api.ote-godaddy.com/v2/commerce/stores/${storeId}/price-adjustment-subgraph`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-store-id': storeId,
      'user-agent': 'my-app/1.0.0 (GoDaddy Commerce Platform)',
    },
  }
);

const adjustments = await adjustClient.request(`
  mutation CalculateAdjustments($input: CalculateAdjustmentsInput!) {
    calculateAdjustments(input: $input) {
      totalDiscountAmount { value currencyCode }
      totalFeeAmount { value currencyCode }
      lines { calculationLine { id } totalDiscountAmount { value currencyCode } }
    }
  }
`, {
  input: {
    discountCodes: ['SUMMER20'],
    lines: [
      { id: 'sku-123', type: 'SKU', quantity: 2,
        subtotalPrice: { value: 4998, currencyCode: 'USD' } },
    ],
  },
});
```

## Common Mistakes

### CRITICAL Missing Bearer prefix in Authorization header

Wrong:

```typescript
headers: { 'Authorization': token }
```

Correct:

```typescript
headers: { 'Authorization': `Bearer ${token}` }
```

The API returns 401 if the `Bearer ` prefix is missing. This is a silent
failure when error handling swallows the status code.

### CRITICAL Using wrong token endpoint URL

Wrong:

```typescript
const tokenUrl = 'https://sso.godaddy.com/v1/token';
```

Correct:

```typescript
const tokenUrl = 'https://api.godaddy.com/v2/oauth2/token';
```

The OAuth token endpoint is `/v2/oauth2/token` on the **API host**
(`api.godaddy.com` or `api.ote-godaddy.com`). Using any other host or
path returns 404 or 405.

### HIGH Subgraph URL missing storeId in path

Wrong:

```typescript
const url = `https://api.ote-godaddy.com/v2/commerce/stores/catalog-subgraph`;
```

Correct:

```typescript
const url = `https://api.ote-godaddy.com/v2/commerce/stores/${storeId}/catalog-subgraph`;
```

The Catalog, Tax, and Price Adjustment subgraph URLs all require
`stores/{storeId}` in the path. Omitting it returns 404. The Orders
subgraph (`/v1/commerce/order-subgraph`) does not require storeId in
the path — it uses the `X-Store-ID` header and GraphQL variables instead.

### HIGH Omitting scope in token request

Wrong:

```typescript
body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'client_credentials' })
```

Correct:

```typescript
body: new URLSearchParams({
  client_id: id, client_secret: secret,
  grant_type: 'client_credentials',
  scope: 'commerce.product:read commerce.order:read',
})
```

Omitting `scope` may return a token without commerce permissions, causing
403 Forbidden on API calls despite having a valid token. Requesting a scope
not provisioned for your OAuth app returns an `invalid_scope` error.

### MEDIUM Using expired token without refresh

Wrong:

```typescript
const token = await getAccessToken();
// reuse for hours without checking expiry
```

Correct:

```typescript
let cached = { token: '', expiresAt: 0 };
async function getValidToken(): Promise<string> {
  if (Date.now() < cached.expiresAt - 60_000) return cached.token;
  const res = await fetchNewToken();
  cached = { token: res.access_token, expiresAt: Date.now() + res.expires_in * 1000 };
  return cached.token;
}
```

Tokens expire in ~1 hour. Cache the token and refresh with a 1-minute
buffer before `expires_in` elapses. After expiry, requests fail with 401.

### MEDIUM Not checking order status before calling draft mutations

Wrong:

```typescript
// Blindly calling updateDraftOrder without knowing current status
await ordersClient.request(UPDATE_DRAFT_ORDER, { input: { id: someOrderId } });
```

Correct:

```typescript
const order = await ordersClient.request(GET_ORDER, { id: orderId });
// Verify the order is in the expected state before mutating
console.log('Order status:', order.orderById.statuses.status);
await ordersClient.request(UPDATE_DRAFT_ORDER, { input: { id: orderId } });
```

Mutations like `updateDraftOrder`, `addLineItemBySkuId`, and
`deleteLineItemById` are designed for draft orders. Query the order
first to confirm its status before attempting mutations to avoid
unexpected errors.
