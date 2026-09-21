---
'@godaddy/react': patch
'@godaddy/localizations': patch
---

Support Stripe 3DS next actions returned by checkout confirmation while preserving existing payment error behavior.

Guard Stripe submissions during validation, synchronization, and authentication so a duplicate attempt cannot unlock an active payment.

Silently ignore duplicate Stripe submissions and record express payment success only after confirmation completes.

Report Stripe express completion with a generic event and Stripe's payment type instead of labeling every wallet as Apple Pay.

When checkout loads an already-paid order, hide payment controls and redirect to the session's success URL. Show the existing payment-success message when no success URL is configured.
