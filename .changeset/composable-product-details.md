---
'@godaddy/gd-commerce-storefront': minor
---

Add composable product parts. `ProductDetailsRoot` with display parts (`ProductDetailsGallery`, `ProductDetailsTitle`, `ProductDetailsPrice`, `ProductDetailsDescription`, `ProductDetailsBackLink`) and purchase parts (`ProductPurchase`, `ProductOptions`, `ProductOption`, `ProductPurchaseStatus`, `ProductAvailability`, `ProductQuantity`, `ProductAddToCart`) build custom product layouts. `useProductDetails` reads product state and `useProductOption` builds custom option controls. Only server-verified SKUs can be added in any layout. `ProductDetails` is unchanged and is now composed from these parts.
