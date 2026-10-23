---
'@godaddy/gd-commerce-storefront': minor
---

Configuration polling now stops instead of continuing every five seconds for as long as the page is visible: after about fifteen minutes (180 requests) while the server reports `unbound`, and thirty minutes (360) while `connecting`. Failed requests count toward the limit. Mount, focus and `retryConnection()` still refresh configuration.
