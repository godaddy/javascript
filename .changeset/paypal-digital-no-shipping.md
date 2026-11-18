---
'@godaddy/react': patch
---

Request NO_SHIPPING from PayPal for digital-only orders so the country-code-only shipping stub is omitted and PayPal no longer rejects checkout with POSTAL_CODE_REQUIRED.
