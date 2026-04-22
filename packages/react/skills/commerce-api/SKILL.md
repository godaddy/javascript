---
name: commerce-api
description: >
  Authenticate with the GoDaddy Commerce Platform using OAuth2 client
  credentials. Covers the /v2/oauth2/token endpoint, environments
  (ote, prod), required headers, scopes, and monetary value formats.
  Always collect client ID, client secret, store ID, and environment
  from the user before making API calls. For API discovery and schema
  introspection use @godaddy/cli (godaddy api list, godaddy api
  describe, godaddy api search) to find endpoints and required scopes.
  For checkout session creation use the Checkout API.
type: core
library: "@godaddy/react"
sources:
  - "godaddy/javascript:packages/react/skills/commerce-api/SKILL.md"
---

# GoDaddy Commerce API — Authentication & Discovery

## Setup

Connecting to the GoDaddy Commerce Platform requires three pieces of
information from the user. **Always ask for these before making any API
calls:**

1. **OAuth client ID** and **client secret** — from their GoDaddy app
2. **Store ID** (UUID) — identifies the merchant store
3. **Environment** — `ote` or `prod` (if not specified, default to `ote`)

If the user provides a custom API host (e.g., for an internal environment),
use it directly instead of the mappings below.

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

**Required headers** for all API requests:

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'x-store-id': storeId,
  'user-agent': 'your-app/1.0.0 (GoDaddy Commerce Platform)',
};
```

**OAuth scopes** — request only the scopes your application needs. Use
`godaddy api describe <endpoint>` to find the exact scopes required for
each endpoint. If a scope is not provisioned for your OAuth app, the
token request returns `invalid_scope`.

| Scope                    | Purpose                          |
|--------------------------|----------------------------------|
| `commerce.product:read`  | Read catalog/SKU data            |
| `commerce.product:write` | Create and update catalog data   |
| `commerce.order:read`    | Read order data                  |

**Monetary values** — all money amounts in API responses are in **minor
units** (cents). For example, `"value": 2500` with `"currencyCode": "USD"`
means **$25.00**, not $2,500. Always divide by 100 for USD display.

## Core Patterns

### Discover APIs with @godaddy/cli

Use the `@godaddy/cli` package (https://www.npmjs.com/package/@godaddy/cli)
to discover available endpoints, inspect their schemas, and identify
required scopes. The CLI is a **discovery tool only** — use the OAuth
token (see Setup above) to make actual API calls in your application code.

Install globally from the npm public registry:

```bash
npm install -g @godaddy/cli
```

Discover available API domains and endpoints:

```bash
# List all API domains
godaddy api list

# List endpoints in a specific domain
godaddy api list --domain catalog-products
godaddy api list --domain orders

# Search for endpoints by keyword
godaddy api search checkout
godaddy api search tax

# Describe an endpoint's schema, parameters, and required scopes
godaddy api describe /location/addresses
godaddy api describe /v1/commerce/stores/{storeId}/orders
```

All CLI commands return structured JSON with `next_actions` that suggest
what to run next. Use `godaddy api describe` to inspect request/response
schemas and required scopes, then use that information to make
authenticated requests with your OAuth token.

**Example: calling the orders API directly using the discovered path and scopes**

```typescript
// 1. Discover: `godaddy api describe /v1/commerce/stores/{storeId}/orders`
//    tells us: GET, scope commerce.order:read, storeId required in path
//
// 2. Request a token with the required scope (see Setup)
// 3. Call the API directly:
const response = await fetch(
  `https://${host}/v1/commerce/stores/${storeId}/orders`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-store-id': storeId,
    },
  }
);
```

> **Note:** Most commerce endpoints require `{storeId}` in the path
> (e.g., `/v1/commerce/stores/{storeId}/orders`,
> `/v2/commerce/stores/{storeId}/catalog-subgraph`). Always check the
> endpoint schema with `godaddy api describe` before implementing.

### Create and Update Checkout Sessions

The Checkout API uses a dedicated host: `checkout.commerce.api.{host}`

```typescript
import { GraphQLClient } from 'graphql-request';

const checkoutClient = new GraphQLClient(
  `https://checkout.commerce.api.ote-godaddy.com/`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-store-id': storeId,
      'user-agent': 'my-app/1.0.0 (GoDaddy Commerce Platform)',
    },
  }
);

const session = await checkoutClient.request(`
  mutation CreateCheckoutSession($input: MutationCreateCheckoutSessionInput!) {
    createCheckoutSession(input: $input) {
      id url status expiresAt
      draftOrder {
        id number
        totals { total { value currencyCode } }
        lineItems { edges { node { id name quantity unitPrice { value currencyCode } } } }
      }
    }
  }
`, {
  input: {
    storeId,
    returnUrl: 'https://example.com/cart',
    successUrl: 'https://example.com/thank-you',
    lineItems: [
      { skuId: 'sku-123', quantity: 1 },
    ],
  },
});

const updated = await checkoutClient.request(`
  mutation UpdateCheckoutSession($id: String!, $input: MutationUpdateCheckoutSessionInput!) {
    updateCheckoutSession(id: $id, input: $input) {
      id status
    }
  }
`, {
  id: session.createCheckoutSession.id,
  input: {
    enablePromotionCodes: true,
    enableShipping: true,
    enableTaxCollection: true,
  },
});
```

### Token Caching

```typescript
let cached = { token: '', expiresAt: 0 };

async function getValidToken(env: 'ote' | 'prod' = 'ote'): Promise<string> {
  if (Date.now() < cached.expiresAt - 60_000) return cached.token;
  const host = env === 'prod' ? 'api.godaddy.com' : 'api.ote-godaddy.com';

  const response = await fetch(`https://${host}/v2/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.OAUTH_CLIENT_ID!,
      client_secret: process.env.OAUTH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
      scope: 'commerce.product:read commerce.order:read',
    }),
  });

  const data = await response.json();
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cached.token;
}
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

### HIGH Checkout API uses a different host than subgraph APIs

Wrong:

```typescript
const url = `https://api.ote-godaddy.com/checkout`;
```

Correct:

```typescript
const url = `https://checkout.commerce.api.ote-godaddy.com/`;
```

The Checkout API uses a dedicated subdomain (`checkout.commerce.api.{host}`),
not a path on the standard API host. Using the wrong host returns 404.

### MEDIUM Using expired token without refresh

Wrong:

```typescript
const token = await getAccessToken();
// reuse for hours without checking expiry
```

Correct:

```typescript
const token = await getValidToken(); // see Token Caching pattern above
```

Tokens expire in ~1 hour. Cache the token and refresh with a 1-minute
buffer before `expires_in` elapses. After expiry, requests fail with 401.
