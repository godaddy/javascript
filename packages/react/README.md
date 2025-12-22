# Checkout Package

## Checkout Session

### Creating a Checkout Session

The `createCheckoutSession` function creates a new checkout session with GoDaddy's commerce API.

```typescript
import { createCheckoutSession } from "@godaddy/react";

const session = await createCheckoutSession(input, options);
```

### Checkout Session Input Configuration

The first parameter accepts all checkout session configuration options from the GraphQL schema:

#### Required Parameters

- **`channelId`** (string): The ID of the sales channel that originated this session
- **`storeId`** (string): The ID of the store this checkout session belongs to  
- **`draftOrderId`** (string): The ID of the draft order
- **`returnUrl`** (string): URL to redirect to when user cancels checkout
- **`successUrl`** (string): URL to redirect to after successful checkout

#### Optional Parameters

- **`customerId`** (string): Customer ID for the checkout session
- **`storeName`** (string): The name of the store this checkout session belongs to
- **`url`** (string): Custom URL for the checkout session
- **`environment`** (enum): Environment - `ote`, `prod`
- **`expiresAt`** (DateTime): When the session expires
- **`enableBillingAddressCollection`** (boolean): Enable billing address collection
- **`enableLocalPickup`** (boolean): Enable local pickup option
- **`enableNotesCollection`** (boolean): Enable order notes collection
- **`enablePaymentMethodCollection`** (boolean): Enable payment method collection
- **`enablePhoneCollection`** (boolean): Enable phone number collection
- **`enablePromotionCodes`** (boolean): Enable promotion/discount codes
- **`enableShippingAddressCollection`** (boolean): Enable shipping address collection
- **`enableSurcharge`** (boolean): Enable surcharge fees
- **`enableTaxCollection`** (boolean): Enable tax collection
- **`enableTips`** (boolean): Enable tip/gratuity options
- **`enabledLocales`** ([String!]): List of enabled locales
- **`enabledPaymentProviders`** ([String!]): List of enabled payment providers
- **`locations`** ([CheckoutSessionLocationInput!]): Available pickup locations
- **`operatingHours`** (CheckoutSessionOperatingHoursMapInput): Store operating hours configuration
- **`paymentMethods`** (CheckoutSessionPaymentMethodsInput): Payment method configurations

### Checkout Session Options

The `CheckoutSessionOptions` interface allows you to configure authentication and other settings:

```typescript
interface CheckoutSessionOptions {
	auth?: {
		clientId: string;
		clientSecret: string;
	};
}
```

#### Authentication Options

- **`auth.clientId`** (string): OAuth2 client ID for GoDaddy API authentication
- **`auth.clientSecret`** (string): OAuth2 client secret for GoDaddy API authentication

When provided, these credentials will be used to obtain an access token for API requests. If not provided, the function will use empty strings which may result in authentication failures.

#### Environment Support

The checkout session supports multiple environments through the input parameter:

- **`prod`**: Production environment (`https://api.godaddy.com`)
- **`ote`**: OTE environment (`https://api.ote-godaddy.com`)

### API Scopes

The checkout session automatically requests the following OAuth2 scopes:

- `commerce.product:read`
- `commerce.order:read`
- `commerce.order:update`
- `location.address-verification:execute`

## Authentication

### OAuth Token Exchange

For authenticated API requests (e.g., UI extensions via the `Target` component), you need to obtain an OAuth access token. The approach depends on your framework.

### Security Considerations

> **⚠️ Important:** The `exchangeIdpToken` function must only run server-side. Never import `@godaddy/react/server` in client code—doing so would expose your `clientSecret` to the browser.
>
> When using the `useAccessToken` hook, the `exchangeToken` callback must call a trusted backend endpoint that performs the token exchange. Never include `clientId` or `clientSecret` in browser code or call the GoDaddy OAuth endpoint directly from the client.

#### Next.js with Server Actions

Use the `exchangeIdpToken` server action:

```typescript
// app/layout.tsx or a server component
import { exchangeIdpToken } from "@godaddy/react/server";
import { cookies } from "next/headers";

export default async function Layout({ children }) {
  const cookieStore = await cookies();
  const idpToken = cookieStore.get("auth_idp")?.value;

  let accessToken: string | undefined;

  if (idpToken) {
    try {
      const result = await exchangeIdpToken({
        clientId: process.env.GODADDY_CLIENT_ID!,
        clientSecret: process.env.GODADDY_CLIENT_SECRET!,
        idpToken,
        scopes: ["commerce.extensions:read"], // optional
      });
      accessToken = result.access_token;
    } catch (error) {
      console.error("Token exchange failed:", error);
    }
  }

  return (
    <GoDaddyProvider accessToken={accessToken}>{children}</GoDaddyProvider>
  );
}
```

#### Other Frameworks (Express, Fastify, etc.)

Call the GoDaddy OAuth endpoint directly from your backend:

```
POST https://api.godaddy.com/v2/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
client_id={clientId}
client_secret={clientSecret}
assertion={idpToken}
scope={optional space-separated scopes}
```

**Response:**

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "commerce.extensions:read"
}
```

Then pass the token to your frontend and provide it to `GoDaddyProvider`:

```typescript
<GoDaddyProvider accessToken={accessTokenFromServer}>
  {children}
</GoDaddyProvider>
```

#### Client-Side Token Management

For SPAs where the token is managed client-side, use the `useAccessToken` hook:

```typescript
import { useAccessToken, GoDaddyProvider } from "@godaddy/react";

function App() {
  const { accessToken, isLoading, error } = useAccessToken({
    exchangeToken: async () => {
      // Call your backend API that exchanges the IDP token
      const response = await fetch("/api/auth/token");
      return response.json(); // { access_token, expires_in }
    },
    onRefreshError: (error) => {
      // Handle refresh failure - e.g., redirect to login
      console.error("Token refresh failed:", error);
      window.location.href = "/login";
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Authentication failed</div>;

  return (
    <GoDaddyProvider accessToken={accessToken}>{/* ... */}</GoDaddyProvider>
  );
}
```

The hook automatically refreshes the token before expiry (default: 60 seconds before).

#### Environment Endpoints

| Environment | OAuth Endpoint                           |
| ----------- | ---------------------------------------- |
| Production  | `https://api.godaddy.com/v2/oauth2/token` |
| OTE         | `https://api.ote-godaddy.com/v2/oauth2/token` |

## Codegen

For now the schema will be downloaded from the order schema.

`pnpm run codegen`

## Todos

- [ ] Add tests
- [ ] Refactor some external libs
  - [ ] graphql-request
  - [ ] arktype - try valibot instead for bundle size sad to lose devx but can be mmuch smaller
  - [ ] floating ui dependencies
