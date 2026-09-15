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

- **`storeId`** (string): The ID of the store this checkout session belongs to
- **`returnUrl`** (string): URL to redirect to when user cancels checkout
- **`successUrl`** (string): URL to redirect to after successful checkout
- **`draftOrderId`** (string): ID of an existing draft order (required if `lineItems` not provided)
- **`lineItems`** ([CheckoutSessionLineItemInput!]): Line items to create a draft order from (required if `draftOrderId` not provided)

#### Optional Parameters

- **`appearance`** (GoDaddyAppearanceInput): Appearance configuration for the checkout (see [Appearance](#appearance))
- **`channelId`** (string): The ID of the sales channel that originated this session
- **`customerId`** (string): Customer ID for the checkout session
- **`enableAddressAutocomplete`** (boolean): Enable address autocomplete
- **`enableBillingAddressCollection`** (boolean): Enable billing address collection
- **`enableLocalPickup`** (boolean): Enable local pickup option
- **`enableNotesCollection`** (boolean): Enable order notes collection
- **`enablePaymentMethodCollection`** (boolean): Enable payment method collection
- **`enablePhoneCollection`** (boolean): Enable phone number collection
- **`enablePromotionCodes`** (boolean): Enable promotion/discount codes
- **`enableShipping`** (boolean): Enable shipping
- **`enableShippingAddressCollection`** (boolean): Enable shipping address collection
- **`enableSurcharge`** (boolean): Enable surcharge fees
- **`enableTaxCollection`** (boolean): Enable tax collection
- **`enableTips`** (boolean): Enable tip/gratuity options
- **`enabledLocales`** ([String!]): List of enabled locales
- **`enabledPaymentProviders`** ([String!]): List of enabled payment providers
- **`environment`** (enum): Environment - `ote`, `prod`
- **`expiresAt`** (DateTime): When the session expires
- **`locations`** ([CheckoutSessionLocationInput!]): Available pickup locations
- **`operatingHours`** (CheckoutSessionOperatingHoursMapInput): Store operating hours configuration (see [Operating Hours](#operating-hours))
- **`paymentMethods`** (CheckoutSessionPaymentMethodsInput): Payment method configurations
- **`shipping`** (CheckoutSessionShippingOptionsInput): Shipping configuration — primarily used to set an `originAddress` for shipping rate calculations and an optional `fulfillmentLocationId`
- **`sourceApp`** (string): The source application that created this checkout session
- **`storeName`** (string): The name of the store this checkout session belongs to
- **`taxes`** (CheckoutSessionTaxesOptionsInput): Tax configuration — used to set an `originAddress` for tax calculations (e.g. the store or warehouse address that taxes are calculated from)
- **`url`** (string): Custom URL for the checkout session

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

The checkout session automatically requests the following OAuth2 scope:

- `commerce.product:read`

### Operating Hours

The `operatingHours` field configures local pickup scheduling — time zones, lead times, pickup windows, pickup mode, and slot intervals.

```typescript
operatingHours: {
  default: {
    timeZone: 'America/New_York',
    leadTime: 60,
    pickupWindowInDays: 7,
    pickupMode: 'dateAndTime',
    pickupSlotInterval: 30,
    hours: {
      monday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      tuesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      wednesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      thursday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      friday: { enabled: true, openTime: '09:00', closeTime: '18:00' },
      saturday: { enabled: true, openTime: '10:00', closeTime: '16:00' },
      sunday: { enabled: false, openTime: null, closeTime: null },
    },
  },
}
```

#### Store Hours Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timeZone` | string | Yes | IANA timezone for the store (e.g. `America/New_York`). All slot times are displayed in this timezone. |
| `leadTime` | number | Yes | Minimum advance notice in minutes before a pickup can be scheduled. Controls the earliest available slot (now + leadTime). |
| `pickupWindowInDays` | number | Yes | Number of days ahead customers can schedule pickup. For backwards compatibility, `0` means ASAP-only mode when `pickupMode` is omitted. |
| `pickupMode` | `'asap' \| 'dateOnly' \| 'dateAndTime'` | No | Controls the pickup selection UI. If omitted, the legacy behavior is preserved: `pickupWindowInDays: 0` resolves to `asap`; otherwise it resolves to `dateAndTime`. |
| `pickupSlotInterval` | number | No | Minutes between selectable time slots (e.g. `30` → 10:00, 10:30, 11:00…). Defaults to 30 if omitted. Used by `dateAndTime` mode. Separate from `leadTime` — the interval controls slot spacing, while leadTime controls advance notice. |
| `hours` | object | Yes | Per-day operating hours. Each day has `enabled` (boolean), `openTime` (HH:mm or null), and `closeTime` (HH:mm or null). |

#### Behavior Notes

- **Pickup modes**:
  - `asap` — No date/time selectors. Checkout sets pickup to ASAP using `now + leadTime` in the store timezone.
  - `dateOnly` — Shows a date selector only. No time selector is shown, and missing time slots do not produce a warning.
  - `dateAndTime` — Shows a date selector and selectable time slots. This is the default for scheduled pickup.
- **Backwards compatibility** — If `pickupMode` is omitted, `pickupWindowInDays: 0` remains ASAP-only. If `pickupWindowInDays` is greater than `0`, checkout uses `dateAndTime`.
- **ASAP option in scheduled pickup** — In `dateAndTime` mode, an ASAP option is shown for today only when the store can fulfill an order (now + leadTime) before closing time.
- **Lead time vs slot interval** — A store with `leadTime: 1440` (24 hours) and `pickupSlotInterval: 15` shows 15-minute slots starting tomorrow, not 24-hour gaps.
- **Timezone handling** — All date/time logic uses the store's `timeZone`, not the customer's browser timezone. A store in Phoenix shows Phoenix hours regardless of where the customer is browsing from.
- **No available slots** — In `dateAndTime` mode, when leadTime exceeds the entire pickup window, no days are enabled, or no selectable slots exist, a "No available time slots" banner is shown.

### Appearance

The `appearance` field customizes the checkout's look and feel.

```typescript
appearance: {
  theme: 'base',
  variables: {
    primary: '#4f46e5',
    background: '#ffffff',
    foreground: '#111827',
    radius: '0.5rem',
  },
}
```

#### Theme

| Value | Description |
|-------|-------------|
| `base` | Default theme |
| `orange` | Orange accent theme |
| `purple` | Purple accent theme |

#### CSS Variables

All fields are optional strings. Pass any subset to override the defaults.

| Variable | Description |
|----------|-------------|
| `accent` | Accent color |
| `accentForeground` | Text on accent backgrounds |
| `background` | Page background |
| `border` | Border color |
| `card` | Card background |
| `cardForeground` | Text on cards |
| `defaultFontFamily` | Default font family |
| `destructive` | Destructive action color (errors, delete) |
| `destructiveForeground` | Text on destructive backgrounds |
| `fontMono` | Monospace font family |
| `fontSans` | Sans-serif font family |
| `fontSerif` | Serif font family |
| `foreground` | Primary text color |
| `input` | Input field background |
| `muted` | Muted/subtle background |
| `mutedForeground` | Text on muted backgrounds |
| `popover` | Popover background |
| `popoverForeground` | Text in popovers |
| `primary` | Primary brand color |
| `primaryForeground` | Text on primary backgrounds |
| `radius` | Border radius (e.g. `0.5rem`) |
| `ring` | Focus ring color |
| `secondary` | Secondary color |
| `secondaryBackground` | Secondary background |
| `secondaryForeground` | Text on secondary backgrounds |

### Loading State

The `<Checkout />` component manages its own loading state internally — it shows a skeleton while it fetches its JWT and draft order, then reveals the form. If you need to coordinate with your own preload work (user profile, theme, feature flags, etc.), the following props let you keep the skeleton up while your data loads.

| Prop | Type | Description |
|------|------|-------------|
| `isLoading` | `boolean` | When `true`, the checkout keeps showing its loading state even after its own internal data has finished loading. Internal queries still run in the background, so the checkout is warm and ready to render the moment you flip this back to `false`. Mount the component early and reveal late — you avoid both the layout flicker of a late-mount and the wasted time of gating the mount entirely. |
| `loadingFallback` | `ReactNode` | Optional override for the loading UI. Defaults to the built-in `<CheckoutSkeleton />`. Rendered whenever `isLoading` is `true` or the checkout is loading its own internal data. |

```tsx
<Checkout
  session={session}
  isLoading={isLoadingUserProfile}
  loadingFallback={<MyCustomSkeleton />}
/>
```

## AI Agent Skills

This package ships a [TanStack Intent](https://tanstack.com/intent/latest) skill that teaches AI coding agents how to authenticate with the GoDaddy Commerce Platform using OAuth2 client credentials and create checkout sessions. For API discovery and testing, the skill directs agents to use [`@godaddy/cli`](https://www.npmjs.com/package/@godaddy/cli).

### Loading the skill

Tell your agent:

```
Read node_modules/@godaddy/react/skills/commerce-api/SKILL.md and use it to authenticate with the GoDaddy Commerce APIs.
```

### Automatic discovery

From your project directory, run:

```
npx @tanstack/intent@latest list
```

This will show the `commerce-api` skill and its path. To set up persistent skill-to-task mappings in your `AGENTS.md`, run:

```
npx @tanstack/intent@latest install
```

Then ask your agent to follow the instructions it outputs.

## Codegen

For now the schema will be downloaded from the order schema.

`pnpm run codegen`

## Todos

- [ ] Add tests
- [ ] Refactor some external libs
  - [ ] graphql-request
  - [ ] arktype - try valibot instead for bundle size sad to lose devx but can be mmuch smaller
  - [ ] floating ui dependencies
