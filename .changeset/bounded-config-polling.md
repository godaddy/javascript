---
'@godaddy/gd-commerce-storefront': minor
---

Configuration polling now ends. While the server reports `unbound`, the provider polls `/api/commerce/config` every five seconds for two minutes, then every 30 seconds, and stops after fifteen minutes, including when refreshes fail. `connecting` follows the same pattern, polling fast for five minutes and stopping after 30. Before, both states polled every five seconds for as long as the page stayed visible, so a site without a store sent a request every five seconds indefinitely. Mount, the page becoming visible and `retryConnection()` still refresh configuration, and the page becoming visible starts a new polling period. Samples, the connecting failure grace and background-tab behavior are unchanged.
