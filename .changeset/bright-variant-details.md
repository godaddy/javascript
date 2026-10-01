---
'@godaddy/gd-commerce-server': patch
'@godaddy/gd-commerce-storefront': patch
---

Remove the unsupported SKUGroup status selection from product details requests so variant products load through the Commerce API. Return 404 for products excluded by the catalog's ACTIVE filter, and show the storefront's not-found page for those responses.
