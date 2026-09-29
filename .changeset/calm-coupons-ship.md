---
"@godaddy/react": patch
"@godaddy/localizations": patch
---

Fix billing collection, shipping reconciliation, and discount/coupon sync across checkout flows.

- Align billing fields and validation for paid, free, pickup, shipping, purchase, and digital orders.
- Respect billing, shipping, phone, and tax collection settings.
- Clear hidden billing addresses when switching to a names-only flow.
- Keep shipping rates, discounts, taxes, and express checkout in sync when coupons change.
- Show a localized retry action when shipping rates cannot be loaded. Clear applied shipping when rates cannot be loaded, and apply the refreshed default method after a successful retry.
