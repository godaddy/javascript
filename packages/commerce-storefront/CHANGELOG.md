# @godaddy/gd-commerce-storefront

## 0.1.1

### Patch Changes

- 8bb3830: Remove the unsupported SKUGroup status selection from product details requests so variant products load through the Commerce API. Return 404 for products excluded by the catalog's ACTIVE filter, and show the storefront's not-found page for those responses.
- c0cf16c: Load active catalog products and SKUs in merchant-defined variant order, while keeping inactive product details visible without purchase controls.
- c0cf16c: Show the draft-order subtotal and explain that shipping, taxes, and discounts are calculated at checkout.
- 8bb3830: Isolate storefront text and surface colors from host styles and support paired dark theme colors.

## 0.1.0

### Minor Changes

- 6724278: Add an opinionated React storefront package with catalog, verified variant selection, a shared cart drawer, and optional hosted checkout handoff. Ship scoped, layer-free CSS compatible with Tailwind v3 host builds, TypeScript response contracts, and an independent consumer example. Keep host application content mounted when commerce configuration is unavailable.
