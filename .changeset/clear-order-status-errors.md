---
'@godaddy/gd-commerce-server': patch
---

Return 400 from the order-status route for invalid order IDs and 404 when the order is missing or belongs to another store or channel, instead of 500. Export `InvalidOrderIdError` and `OrderNotFoundError` for in-process `getOrderStatus()` callers.
