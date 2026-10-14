---
'@godaddy/gd-commerce-storefront': minor
---

Add composable product parts. `ProductDetailsRoot` with display parts (`ProductDetailsGallery`, `ProductDetailsTitle`, `ProductDetailsPrice`, `ProductDetailsDescription`, `ProductDetailsBackLink`) and purchase parts (`ProductDetailsPurchase`, `ProductDetailsOptions`, `ProductDetailsOption`, `ProductDetailsPurchaseStatus`, `ProductDetailsAvailability`, `ProductDetailsQuantity`, `ProductDetailsAddToCart`) build custom product layouts. `useProductDetails` reads product state and `useProductDetailsOption` builds custom option controls. Only server-verified SKUs can be added in any layout. `ProductDetails` is now composed from these parts and is visually unchanged. Its markup gains wrapper elements, and the disabled add button now gets its accessible description from a hidden reason element.
