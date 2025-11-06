# @godaddy/react

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
