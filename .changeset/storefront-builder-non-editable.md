---
"@godaddy/gd-commerce-storefront": patch
---

Parts that show a connected store's data, such as product names, prices, images and cart lines, now carry `data-dev-source-origin="commerce"` for site builders such as Airo. Wrappers, host text and labels, the connection status and sample products stay unmarked. The new `COMMERCE_DATA_ATTRIBUTE` constant and `useCommerceData()` hook let custom parts mark themselves, and `markCommerceData={false}` on the provider leaves the attribute out.
