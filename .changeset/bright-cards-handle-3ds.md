---
'@godaddy/react': patch
'@godaddy/localizations': patch
---

Support Stripe 3DS next actions returned by checkout confirmation while preserving existing payment error behavior.

Guard Stripe submissions during validation, synchronization, and authentication so a duplicate attempt cannot unlock an active payment.

Silently ignore duplicate Stripe submissions and record express payment success only after confirmation completes.

Report Stripe express completion as `express_stripe_${paymentType}_completed.event` using Stripe's payment type instead of labeling every wallet as Apple Pay.
