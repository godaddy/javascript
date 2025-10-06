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
- **`environment`** (enum): Environment - `dev` (default), `ote`, `prod`, `test`
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
- **`dev`**: Development environment (`https://api.dev-godaddy.com`) - default
- **`test`**: Test environment (`https://api.test-godaddy.com`)

### API Scopes

The checkout session automatically requests the following OAuth2 scopes:

- `commerce.product:read`
- `commerce.order:read`
- `commerce.order:update`
- `location.address-verification:execute`

## Codegen

For now the schema will be downloaded from the order schema.

`pnpm run codegen`

## Todos

- [ ] Add tests
- [ ] Refactor some external libs
  - [ ] graphql-request
  - [ ] arktype - try valibot instead for bundle size sad to lose devx but can be mmuch smaller
  - [ ] floating ui dependencies
