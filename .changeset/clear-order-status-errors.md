---
'@godaddy/gd-commerce-server': patch
---

Return 400 from the order-status route for invalid order IDs and 404 when the order is missing or belongs to another store or channel, instead of 500. The 500 response no longer includes the internal error message; it is logged server-side instead. Export `InvalidOrderIdError`, `OrderNotFoundError`, and `ORDER_STATUS_UNKNOWN` for in-process `getOrderStatus()` callers.
