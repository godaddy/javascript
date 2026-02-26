---
"@godaddy/react": patch
"@godaddy/localizations": patch
---

Add CCAvenue payment provider support and improvements

**@godaddy/react**
- Add CCAvenue checkout button with shipping validation (require shipping methods when delivery is SHIP)
- Add CCAvenueReturnProvider for return flow with JWT auth support and confirm checkout loader
- Use env-based redirect URL for CCAvenue gateway
- Disable form and mutations when confirming checkout

**@godaddy/localizations**
- Add CCAvenue payment method labels and descriptions for all supported locales
