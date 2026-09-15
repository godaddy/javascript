---
"@godaddy/react": patch
---

Support tips in unified checkout

Adds the `tips` session config surface (`default` and threshold-based `amounts`/`percentages` presets) alongside `enableTips`, and includes the selected tip in wallet sheet totals and the authorized/confirmed amount.

For redirect gateways (CCAvenue), the authorized tip is persisted across the redirect so the confirmation on the return leg records the tip the customer was actually charged. Checkout refuses to redirect when a non-zero tip cannot be persisted, rather than sending the customer to pay a tip the order would not include.

Express checkout stays tip-free: its wallet sheets open on the item subtotal and add the shipping and taxes they calculate in their own event flows, and its confirmation records no tip.

Also gives every `Button` a `cursor-pointer`, so buttons rendered as `<button>` show a pointer cursor on hover instead of the browser default.
