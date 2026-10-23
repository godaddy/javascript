---
'@godaddy/gd-commerce-storefront': minor
---

Configuration polling while the server reports `unbound` or `connecting` now ends. After the page loads, the provider polls `/api/commerce/config` every five seconds for five minutes, then every minute, and stops at thirty minutes, whether or not requests fail. Before, it polled every five seconds for as long as the page stayed visible. Reloading the page starts polling again, and focus and `retryConnection()` still refresh configuration. A page still `connecting` when polling stops shows the connection error with "Retry connection" instead of waiting indefinitely.
