---
'@godaddy/gd-commerce-server': patch
---

Forward server-configured checkout payment methods, including standard Google Pay, for cart, Buy Now, and non-catalog checkout. Keep the standard GoDaddy card default when optional payment settings are absent or malformed, without resetting valid checkout flags.

Warn through the configured logger when invalid payment methods fall back to standard GoDaddy card payments, without logging configuration values.
