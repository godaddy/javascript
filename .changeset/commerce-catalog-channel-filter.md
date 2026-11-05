---
"@godaddy/gd-commerce-server": patch
---

Filter storefront product lists and product details by the server-configured Commerce channel. Active products unavailable on that channel no longer appear in lists or resolve through direct product links. Search, category filters, and explicit product IDs retain the channel filter; browser query parameters cannot override it.

Document stale-channel empty results and upstream channel lookup costs. Product browsing filters do not check channel eligibility for SKU lookup or cart writes; hosts must enforce any required restrictions on those operations.
