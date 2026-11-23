---
'@godaddy/react': patch
---

Request NO_SHIPPING from PayPal unless the buyer is shipping to a collected address. Digital, purchase-mode and pickup orders no longer send a country-code-only shipping stub, which PayPal rejected with POSTAL_CODE_REQUIRED.
