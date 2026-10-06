---
'@godaddy/gd-commerce-server': minor
---

Return 400 from the order-status route for invalid order IDs, including IDs the Orders API rejects as malformed, and 404 when the Orders API reports the order missing or it belongs to another store or channel, instead of 500. A 404 without the Orders API's `NOT_FOUND` code, such as from a misconfigured base URL, stays a logged 500. The 500 response no longer includes the internal error message; it is logged server-side instead. Export `InvalidOrderIdError`, `OrderNotFoundError`, and `ORDER_STATUS_UNKNOWN` for in-process `getOrderStatus()` callers; check `error.name` rather than `instanceof` so the check holds when a host has more than one copy of this package.
