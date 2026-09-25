# Checkout configuration

## Goal

Storefronts should respond to a merchant enabling or disabling shipping, taxes, or discounts without requiring the builder agent to edit application code. This document records the current design, its temporary limitation, and the intended long-term solution.

## Decisions

- The cart remains a draft order. We will not create a checkout session when the cart is created or maintain a lazy session while the shopper edits it.
- The cart does not calculate or estimate shipping, taxes, or discounts. It displays **Subtotal** and one message: “Shipping, taxes, and discounts are calculated at checkout.” The message has the stable `commerce-cart-checkout-adjustments-note` class so an application can hide it easily.
- A checkout session is created only when the shopper selects **Checkout**. The Checkout API and the enabled commerce providers perform the actual calculations.
- Checkout capability flags are server-only. They must not be exposed by `/api/commerce/config` or supplied by browser code.
- We will defer live capability discovery in this library because the Checkout API is expected to discover enabled providers through App Registry. Until that work ships, configuration can be refreshed during an initial build or a later rebuild/redeploy.

This keeps the cart simple, avoids a second source of pricing logic, and lets shipping rates, tax rules, and discounts remain authoritative in their respective services.

## Source of truth

App Registry is the source of truth for whether the store has a provider enabled for each capability:

| Capability | App Registry action |
| --- | --- |
| Shipping | `commerce.shipping-rates.calculate` |
| Taxes | `commerce.taxes.calculate` |
| Discounts | `commerce.price-adjustment.apply` |

App Registry indicates that a capable GPA is enabled; the shipping, tax, and discount services still own their settings, rules, and calculations. The general Settings API is not a consolidated source for these three enablement states.

Commerce Admin already exposes this lookup to builders through the `commerce_checkout_configuration_get` MCP tool. Given a `storeId` and `channelId`, it validates their binding, queries enabled App Registry actions, and returns checkout flags such as `enableShipping`, `enableTaxCollection`, and `enablePromotionCodes`, plus shipping-origin readiness.

## Temporary build-time flow

Until Checkout API performs App Registry discovery itself:

1. During every initial build and rebuild/redeploy, the builder calls `commerce_checkout_configuration_get`.
2. The deployment writes the three returned feature flags to the server-only `GODADDY_CHECKOUT_CONFIGURATION` value; it does not copy the full MCP response or generate conditional application code.
3. When Checkout is selected, `commerce-server` reads that value and explicitly configures the new checkout session.
4. The enabled providers calculate live rates and adjustments during checkout.

For example:

```json
{
  "enablePromotionCodes": true,
  "enableTaxCollection": true,
  "enableShipping": true
}
```

Restoring the server reader alone does not discover merchant settings: the builder/deployment integration must populate this value. Shipping-origin address details do not need to be copied into application code; hosted checkout can use store configuration.

The accepted stopgap is eventually consistent: a provider enabled or disabled after deployment is reflected on the next rebuild, not immediately. This is acceptable only while the Checkout API change is pending.

## Important compatibility detail

The current checkout request builder applies explicit defaults of `false` for shipping, shipping-address collection, and tax collection. Removing `GODADDY_CHECKOUT_CONFIGURATION` without changing that behavior disables those features and is a regression. Also, omitting fields is not a complete substitute: Checkout API currently defaults shipping to enabled, but does not similarly enable address collection, taxes, or promotion codes.

## Long-term flow

Checkout API should query App Registry when a session is created and automatically enable shipping, taxes, and discounts for the store’s active GPAs. Once that is available and verified, this repository can remove the static checkout configuration and its build-time synchronization. The cart and draft-order lifecycle do not need to change.
