---
'@godaddy/commerce-server': minor
---

Add an Express server package for GoDaddy Commerce catalog, cart, and hosted checkout routes, with production API defaults and host-owned configuration and attribution.

Require host-approved checkout return URLs and keep non-catalog pricing in trusted server helpers. Recover saved carts when the Orders API reports a missing or completed draft.

Read completed orders through the authorized Orders REST API with the `commerce.order:read` scope.
