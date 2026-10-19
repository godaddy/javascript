---
"@godaddy/gd-commerce-storefront": minor
---

Make the storefront parts more extensible without reimplementing their rules.

- `ProductDetailsRoot` takes a `productId` prop, which falls back to the route's `:productId`, so a product can render in a quick view or outside its route. `urlState={false}` keeps that root's selection out of the page URL, so two roots on one page no longer share a selection. `loading`, `notFound` and `error` replace those states. A root with no product ID now shows the not-found state without requesting `/products/`, and warns in development.
- `CatalogRoot` and `Catalog` take `pageSize`, which defaults to 6. `CatalogRoot` takes `urlState={false}` for a second catalog on a page. `CatalogEmpty` renders a custom empty state, like `CartEmpty`.
- `CartButton`, `AddToCartButton`, `ProductDetailsAddToCart`, `ProductCardAction`, `CartCheckout`, `CartItemRemove`, `CartTitle`, `CartDescription` and `ProductDetailsBackLink` take replacement text as children, or a function of the part's state, such as `({ busy }) => …`. The controls keep their behavior.
- `CommerceProvider` and `CommerceStorefront` take `locale` for price formatting, which defaults to `en-US`; an invalid tag falls back to it. `useMoney()` formats prices in that locale for custom parts, `money()` takes an optional locale, and `ProductImage` is exported.
- `onEvent` reports `item-added`, `quantity-changed`, `item-removed`, `discount-applied`, `checkout-started` and `error` events. A host callback that throws, including `onItemAdded`, is now logged instead of failing the cart operation and showing its message as a cart error.
- Every part's outer element has a stable `data-commerce-part` attribute, such as `cart-checkout`, documented as a styling hook. No elements are added or removed.
