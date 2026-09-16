---
'@godaddy/react': minor
---

PayPal's public SDK configuration (`clientId`, `merchantId`, `partnerAttributionId`, `disableFunding`) now falls back to `session.paymentProviderConfiguration.paypal` when no explicit `paypalConfig` prop is supplied, so hosted checkout can initialize PayPal without the embedding app passing it in. Also adds `partnerAttributionId` support (wired into the PayPal JS SDK's `dataPartnerAttributionId`) and no longer offers PayPal as a selectable payment method when no usable configuration is available from either source.
