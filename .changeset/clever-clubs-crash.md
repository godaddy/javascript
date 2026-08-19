---
"@godaddy/react": patch
---

fix: align billing collection across rendering, validation, and the form schema

- Validate paid offline orders with the payment-form rules instead of the free-order
  rules, so a rendered billing address is actually required before confirming.
- Offline pickup collects names only, since taxes use the pickup location.
- Purchase-mode offline orders collect a billing address only when tax collection
  needs a destination, and never when billing address collection is disabled.
- Free orders now follow the same billing rules as paid offline orders, fixing free
  purchase-mode and separate-billing shipping orders that required billing fields the
  form never rendered.
- Free shipping orders render the "use shipping address as billing" toggle, so they can
  opt in or out of a separate billing address like paid orders already could.
- Changing payment or delivery method to a flow that only collects billing names now
  clears the billing address from the draft order, instead of keeping one the customer
  can no longer see. A billing address already present on the draft order at load is
  left untouched.
- Validate the billing phone on offline pickup orders, which was silently skipped.
- Stop requiring a shipping address when `enableShippingAddressCollection` is false.
