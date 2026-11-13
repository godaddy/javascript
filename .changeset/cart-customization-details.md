---
"@godaddy/gd-commerce-server": patch
"@godaddy/gd-commerce-storefront": patch
---

Carry optional `details` (`productAssetUrl`, `selectedAddons`) and `metafields` through every add-to-cart call, so a shopper's product customization reaches checkout and the order instead of staying client-side only. Existing calls without these fields behave exactly as before.
