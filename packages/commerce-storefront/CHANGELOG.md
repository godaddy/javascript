# @godaddy/gd-commerce-storefront

## 0.5.0

### Minor Changes

- 94cf3e6: `AddToCartButton` now says why it is disabled through its accessible description: more than the available stock, a quantity that is not a whole number of 1 or more, the cart still loading, the store connecting, the store not reachable, or no store connected. `ProductDetailsQuantity` shows the quantity message under the field and marks the field invalid. A SKU whose available count is negative (oversold) now counts as sold out, like a count of 0. Default rendering is unchanged for quantities that can be added.
- 94cf3e6: Add composable cart parts. `CartDrawerRoot` builds a custom cart drawer and `CartRoot` builds a cart page, both from the same parts: `CartTitle`, `CartDescription`, `CartClose`, `CartNotices`, `CartItems`, `CartEmpty`, `CartSummary`, `CartSubtotal`, `CartCheckoutNote` and `CartCheckout`. `CartItems` renders its child as the item for every line, built from `CartItemRoot` with `CartItemImage`, `CartItemName`, `CartItemOptions`, `CartItemPrice`, `CartItemQuantity` and `CartItemRemove`. `useCart` reads the cart anywhere inside the provider, for example for a custom cart button, and `useCartItem` reads one line. `CommerceProvider` and `CommerceStorefront` take an optional `onItemAdded` callback, called after every live or sample add, so a site with a cart page can confirm adds. An add now opens the drawer only when a `CartDrawer` or `CartDrawerRoot` is mounted. Without one, `open` stays `false` and `CartButton` does nothing. Every action still goes through the shared cart queue, and the sample cart never reaches the store. `CartDrawer` is now composed from these parts. Visual change: the packaged drawer now shows the 1px divider between cart lines that it always declared, which the CSS reset hid. The `commerce-cart-checkout-adjustments-note` class moved from the note's paragraph to its outer element, so hiding it also removes its spacing. Markup changes: each part has a wrapper `<div>`, the line list is a `role="list"` element instead of a `<ul>`, its lines are `role="listitem"` elements, and the drawer panel sits inside a positioning element.

### Patch Changes

- 94cf3e6: Deprecate `Catalog`'s `title`, `description` and `showHeader` props. They still work. Compose `CatalogRoot` with `<CatalogHeader title='…' description='…' />` instead, or leave `CatalogHeader` out when the page renders its own H1. Catalog loading placeholders now render inside the `CatalogProducts` element, so they follow the host's grid. The packaged catalog's placeholders now use its loaded spacing from the `lg` breakpoint, 32px between cards and 40px above and below, instead of 24px and 32px.

## 0.4.0

### Minor Changes

- 2d19f71: Add composable catalog and product card parts. `CatalogRoot` with `CatalogHeader`, `CatalogSummary`, `CatalogProducts` and `CatalogPagination` builds custom catalog layouts. `ProductCardRoot` with `ProductCardImage`, `ProductCardTitle`, `ProductCardDescription`, `ProductCardPrice` and `ProductCardAction` builds custom cards, either as the card template inside `CatalogProducts` or for a product the host already has. `useProductCard` reads card state. `ProductCardProps` types the packaged card's props. Card parts take no product, SKU or price props, so a direct add is still offered only for a product with one SKU and no options, and samples add only to the sample cart. `Catalog` and `ProductCard` are now composed from these parts. Visual changes: catalog cards in the same row are now the same height, with their price rows aligned at the bottom, and the sample catalog's summary row uses the live catalog's padding, 32px instead of 24px above and below from the `sm` breakpoint. A standalone `ProductCard` is unchanged. Markup changes: each part has a wrapper `<div>`, catalog cards are now direct children of the grid instead of each having its own surface wrapper, and the sample summary text is a `<p>` inside a `<div>`.

### Patch Changes

- a3824b8: Host layout classes now take effect on `ProductDetailsPrice`, `ProductDetailsOptions`, `ProductDetailsPurchase` and `CatalogPagination`. For example, `<ProductDetailsOptions className='grid grid-cols-2 gap-4' />` puts the selects in two columns. `ProductDetailsRoot` and `CatalogRoot` keep the host `className` while connecting, loading or showing an error. A card's image link is hidden from keyboard and screen reader users in server HTML when the card has a title. A `CatalogProducts` card template of `false` or an empty string renders the packaged card. Default rendering is unchanged.
- c0ea9e2: Space out the product details purchase area. Options are now 24px apart, the status or stock message sits 8px below the options, and the quantity and add to cart button are 24px apart. Previously the options, messages and quantity had no gap between them. `ProductDetailsOptions` spaces its selects the same way. The "Checking this variant…" message now uses the same small text as the other purchase messages.
- cde208c: Product option selects draw their own chevron 12px in from the right edge instead of the browser's arrow, which sat against the border. Their text now starts at the same 12px padding as other inputs. The README notes that a host class with the same name as one of the package's utilities loses to the package's rule.

## 0.3.0

### Minor Changes

- 03a836e: Add composable product parts. `ProductDetailsRoot` with display parts (`ProductDetailsGallery`, `ProductDetailsTitle`, `ProductDetailsPrice`, `ProductDetailsDescription`, `ProductDetailsBackLink`) and purchase parts (`ProductDetailsPurchase`, `ProductDetailsOptions`, `ProductDetailsOption`, `ProductDetailsPurchaseStatus`, `ProductDetailsAvailability`, `ProductDetailsQuantity`, `ProductDetailsAddToCart`) build custom product layouts. `useProductDetails` reads product state and `useProductDetailsOption` builds custom option controls. Only server-verified SKUs can be added in any layout. `ProductDetails` is now composed from these parts and is visually unchanged. Its markup gains wrapper elements, and the disabled add button now gets its accessible description from a hidden reason element.

## 0.2.0

### Minor Changes

- 2aba6ea: Support storefronts that are not connected to a store yet. `Catalog sampleProducts` shows built-in sample products and a local sample cart only while the server reports `unbound`, and the components switch to the connected store automatically, without source changes. Unknown state, empty live catalogs, and failures never show samples. Add optional `CommerceConfiguration.readConnectionState()` to the server config contract, and reject live operations until the state is `ready`. Existing successful config responses and live cart behavior are unchanged.

## 0.1.3

### Patch Changes

- bb341e8: Keep storefront component wrappers transparent when setting the commerce surface palette. Preserve opaque themed backgrounds for controls and the cart drawer. Applications that need a catalog or product section background should set it on their own layout elements.

## 0.1.2

### Patch Changes

- b9f3415: Default storefront wrappers to transparent backgrounds and inherited text colors so they blend into the host theme, while preserving explicit commerce theme overrides.

## 0.1.1

### Patch Changes

- 8bb3830: Remove the unsupported SKUGroup status selection from product details requests so variant products load through the Commerce API. Return 404 for products excluded by the catalog's ACTIVE filter, and show the storefront's not-found page for those responses.
- c0cf16c: Load active catalog products and SKUs in merchant-defined variant order, while keeping inactive product details visible without purchase controls.
- c0cf16c: Show the draft-order subtotal and explain that shipping, taxes, and discounts are calculated at checkout.
- 8bb3830: Isolate storefront text and surface colors from host styles and support paired dark theme colors.

## 0.1.0

### Minor Changes

- 6724278: Add an opinionated React storefront package with catalog, verified variant selection, a shared cart drawer, and optional hosted checkout handoff. Ship scoped, layer-free CSS compatible with Tailwind v3 host builds, TypeScript response contracts, and an independent consumer example. Keep host application content mounted when commerce configuration is unavailable.
