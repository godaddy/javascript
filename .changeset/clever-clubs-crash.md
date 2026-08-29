---
"@godaddy/react": patch
---

Fix billing collection across checkout flows.

- Align billing fields and validation for paid, free, pickup, shipping, purchase, and digital orders.
- Respect billing, shipping, phone, and tax collection settings.
- Clear hidden billing addresses when switching to a names-only flow.
- Keep totals and taxes accurate when discounts are applied.
