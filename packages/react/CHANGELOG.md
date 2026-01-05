# @godaddy/react

## 1.0.16

### Patch Changes

- bfdd630: Apply shipping intent when no shipping methods returned

## 1.0.15

### Patch Changes

- 40aeb75: Set default storefront lineItem fulfillmentMode to NONE when adding to cart

## 1.0.14

### Patch Changes

- d99b69d: - Add filtering by `productIds` and `categoryIds` to ProductGrid
  - Add `productId` prop to ProductCard for single product rendering
  - Add pagination support to ProductGrid with `enablePagination` prop
  - Add translations for pagination controls
- Updated dependencies [d99b69d]
  - @godaddy/localizations@1.0.5

## 1.0.13

### Patch Changes

- b17602f: Add Tailwind v3/v4 compatible CSS export

## 1.0.12

### Patch Changes

- e5504b4: remove sessionId requirement for applyDiscount

## 1.0.11

### Patch Changes

- 8c9ea85: Add missing session error state
- Updated dependencies [8c9ea85]
  - @godaddy/localizations@1.0.4

## 1.0.10

### Patch Changes

- 83aae9a: Fix bug where GDP tries to load before having session values

## 1.0.9

### Patch Changes

- 2cb4ac6: - Update collect SDK CDN urls
  - Add localization keys for cart components
  - Optional businessId for GDP config (will pull from store data if not provided)
- Updated dependencies [2cb4ac6]
  - @godaddy/localizations@1.0.3

## 1.0.8

### Patch Changes

- c484494: Added cart functionality with `useAddToCart` hook and `Cart` component.
  Fixed hydration mismatch in `Cart` component.
  Removed internal environment references.

## 1.0.7

### Patch Changes

- 6b5d7d9: fix formatting for major units in formatCurrency

## 1.0.6

### Patch Changes

- 16b571f: Add support for locale prop on context provider

## 1.0.5

### Patch Changes

- 4058d97: Refactor currency formatting to respect currency precision

## 1.0.4

### Patch Changes

- f4f79d6: Add product grid and product details components using public storefront apis

## 1.0.3

### Patch Changes

- 811bb55: Add auth-token exchange

## 1.0.3

### Patch Changes

- c0eed81: Add optional appearance to checkout session

## 1.0.2

### Patch Changes

- 445d787: Small formatting issues and fixes
- Updated dependencies [445d787]
  - @godaddy/localizations@1.0.2

## 1.0.1

### Patch Changes

- 0e07815: - Add latest translations.
  - Add address autocomplete feature flag and US support for address autocomplete.
  - Update tracking events.
  - Improved address reset logic in the checkout form.
  - Fix issues with country data missing regions codes.
- Updated dependencies [0e07815]
  - @godaddy/localizations@1.0.1

## 1.0.0

### Major Changes

- 1864bc2: This marks the first stable major release of our GoDaddy JavaScript libraries, representing a significant milestone in our platform development.

  A comprehensive React component library for GoDaddy checkout experiences, featuring:

  - Complete checkout session management with GraphQL integration
  - Support for multiple payment providers (Stripe, PayPal)
  - Comprehensive checkout features including billing/shipping addresses, tips, promotions, and tax collection
  - Multi-environment support (dev, ote, prod, test)
  - Built with modern React patterns using Radix UI components and Tailwind CSS

  Internationalization support for GoDaddy checkout components:

  - Structured localization framework covering all checkout aspects
  - Initial French (France) localization with comprehensive translation coverage
  - Extensible architecture for adding additional locales
  - Seamless integration with the React component library

  Essential platform integration tools for GoDaddy app developers:

  - Cryptographic request verification using ECDSA-P256-SHA256
  - Webhook subscription verification with HMAC-SHA256
  - Framework-specific adapters for Express.js and Next.js
  - Comprehensive error handling following GoDaddy standards
  - Environment-based configuration support

  These packages provide the foundation for building robust, secure, and internationalized applications on the GoDaddy platform.

### Patch Changes

- Updated dependencies [1864bc2]
  - @godaddy/localizations@1.0.0

## 0.1.0

### Minor Changes

- intitial release
