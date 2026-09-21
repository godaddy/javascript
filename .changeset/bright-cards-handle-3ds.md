---
'@godaddy/react': patch
'@godaddy/localizations': patch
---

Support Stripe 3DS next actions returned by checkout confirmation while preserving existing payment error behavior.

Guard Stripe submissions during validation, synchronization, and authentication so a duplicate attempt cannot unlock an active payment.
