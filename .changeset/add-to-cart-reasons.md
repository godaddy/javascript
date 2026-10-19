---
"@godaddy/gd-commerce-storefront": minor
---

`AddToCartButton` now says why it is disabled through its accessible description: more than the available stock, a quantity that is not a whole number of 1 or more, the cart still loading, the store connecting, the store not reachable, or no store connected. `ProductDetailsQuantity` shows the quantity message under the field and marks the field invalid. A SKU whose available count is negative (oversold) now counts as sold out, like a count of 0. Default rendering is unchanged for quantities that can be added.
