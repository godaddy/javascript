---
'@godaddy/react': patch
'@godaddy/localizations': patch
---

Add Stripe 3DS verification support for card and express checkout, with localized payment errors and compatibility with existing checkout error handling.

Improve payment retry handling, prevent duplicate submissions, and recognize already-paid orders. While a 3-D Secure payment's outcome is unknown, every payment method is blocked from starting another payment for the checkout. Update express payment tracking to reflect the payment method used and successful checkout completion.
