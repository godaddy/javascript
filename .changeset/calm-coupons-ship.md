---
"@godaddy/react": patch
"@godaddy/localizations": patch
---

Keep shipping rates, discounts, taxes, and express checkout in sync when coupons change.

- Refetch shipping rates after a coupon is applied or removed, and keep the customer's chosen shipping method while it is still offered.
- Show a localized retry action when shipping rates cannot be loaded. Clear applied shipping when rates cannot be loaded, and apply the refreshed default method after a successful retry.
- Remove the unused `experimental_rules.freeShipping` session field.
