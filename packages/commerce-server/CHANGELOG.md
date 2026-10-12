# @godaddy/gd-commerce-server

## 0.1.1

### Patch Changes

- 8bb3830: Remove the unsupported SKUGroup status selection from product details requests so variant products load through the Commerce API. Return 404 for products excluded by the catalog's ACTIVE filter, and show the storefront's not-found page for those responses.
- c0cf16c: Load active catalog products and SKUs in merchant-defined variant order, while keeping inactive product details visible without purchase controls.
- c0cf16c: Show the draft-order subtotal and explain that shipping, taxes, and discounts are calculated at checkout.

## 0.1.0

### Minor Changes

- 6724278: Add an Express server package for GoDaddy Commerce catalog, cart, and hosted checkout routes, with production API defaults and host-owned configuration and attribution.
  
  Require host-approved checkout return URLs and keep non-catalog pricing in trusted server helpers. Recover saved carts when the Orders API reports a missing or completed draft.
  
  Read completed orders through the authorized Orders REST API with the `commerce.order:read` scope.
