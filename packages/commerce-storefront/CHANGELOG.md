# @godaddy/gd-commerce-storefront

## 0.7.0

### Minor Changes

- 7e94726: Redesign the packaged components with a cleaner default look, legible on light and dark host pages without configuration.
  
  - **Catalog.** Cards drop their border and sit directly on the page: a square image with square corners, the name, the price, and a full-width outlined action. A "Sale" badge shows when a SKU's compare-at price is above that SKU's price; the catalog list has no SKU prices, so a card shows it only when the lowest compare-at price is above the highest price. A single price also shows its compare-at price struck through; a price range shows only the badge. The packaged card no longer shows the description; `ProductCardDescription` adds it back. The title and description sit beside the product count. The grid has two columns on phones, then as many 240px columns as fit. Pagination is centered and hidden when there is only one page.
  - **Product page.** A square gallery with the Sale badge, and options as buttons (radios) instead of selects. Until options are chosen, the price reads "From" the lowest price, with a struck-through compare-at price only when the cheapest SKUs share it, so it never pairs prices from different SKUs. An option with more than eight values stays a select. Values whose SKUs are all sold out, given the other selections, are crossed out and announced as sold out, but stay selectable. The quantity is a stepper capped at the stock, beside an add button labeled with the total, such as "Add to cart · $64.00". Before every option is chosen the button stays enabled and names the next one, such as "Select size"; pressing it shows an error on each missing option and focuses the first.
  - **Product page parts in custom layouts.** `ProductDetailsQuantity` now renders before a SKU is chosen, and changing a selection keeps the quantity instead of resetting it to 1; a quantity above the new SKU's stock shows the quantity error. `ProductDetailsPurchaseStatus` no longer shows "Select all options to add this item to your cart." before every option is chosen, because `ProductDetailsAddToCart` now names the missing option. A layout that replaces the add button should show its own prompt for missing options.
  - **Cart drawer.** The title shows the item count, such as "Your cart (3)". Thumbnails are square, a line's options share one line ("Color: Blue · Size: M"), and the checkout note is a "Shipping, taxes & discounts: Calculated at checkout" row under the subtotal. "Proceed to checkout" is followed by a new `CartContinueShopping` part. The empty cart has a bag icon and an outlined "Browse products" link. The live drawer no longer has a description; the sample drawer keeps its own.
  - **`CartButton`** is a bag icon with a count badge that pops when the count changes, named "Cart, 2 items". Its children replace the icon with a label.
  - **Swatches**, off by default: a new `getSwatch` provider prop returns a CSS background for an attribute value. Attributes whose values all have one render as swatches on the product page and as dots on cards (`ProductCardSwatches`). `useProductDetailsOption` values now include `soldOut` and `swatch`, and the option has `missing`.
  - **`RelatedProducts`**, a new optional component, shows other products from the catalog's first page, for placing after the product page.
  - New parts `ProductCardBadge` and `ProductDetailsBadge`, and theme properties `--commerce-sale` and `--commerce-on-sale` for the badge.
  - Muted text, hairlines, image placeholders, outlined buttons and disabled buttons now derive from the inherited text color, instead of from `--commerce-surface`. Previously they assumed a light background, so on a dark page muted text and lines were hard to read and controls painted light boxes.
  - Error and warning messages bring their own light background in every context. Previously inline errors were red text on whatever background was behind them.
  - Primary buttons show a focus ring in `--commerce-accent`, and inputs draw theirs inside the border, so focus shows on any page background.

## 0.6.0

### Minor Changes

- 1958f0a: Make the storefront parts more extensible without reimplementing their rules.
  
  - `ProductDetailsRoot` takes a `productId` prop, which falls back to the route's `:productId`, so a product can render in a quick view or outside its route. `urlState={false}` keeps that root's selection out of the page URL, so two roots on one page no longer share a selection. `loading`, `notFound` and `error` replace those states. A root with no product ID now shows the not-found state without requesting `/products/`, and warns in development.
  - `CatalogRoot` and `Catalog` take `pageSize`, which defaults to 6. `CatalogRoot` takes `urlState={false}` for a second catalog on a page. `CatalogEmpty` renders a custom empty state, like `CartEmpty`.
  - `CartButton`, `AddToCartButton`, `ProductDetailsAddToCart`, `ProductCardAction`, `CartCheckout`, `CartItemRemove`, `CartTitle`, `CartDescription` and `ProductDetailsBackLink` take replacement text as children, or a function of the part's state, such as `({ busy }) => …`. The controls keep their behavior, and a replaced label stays the start of the accessible name. `CartItemRemove` now names its line with visually hidden text instead of `aria-label`; its accessible name is unchanged.
  - `CommerceProvider` and `CommerceStorefront` take `locale` for price formatting, which defaults to `en-US`; an invalid tag falls back to it. `locale` only formats; localized UI text will be a separate opt-in prop. `useMoney()` formats prices in that locale for custom parts, `money()` takes an optional locale, and `ProductImage` is exported. `ProductImage` now loads a new `url` after an earlier one failed, instead of keeping the placeholder.
  - `onEvent` reports `item-added`, `quantity-changed`, `item-removed`, `discount-applied`, `checkout-started` and `error` events. A host callback that throws or rejects, including `onItemAdded`, is now logged instead of failing the cart operation and showing its message as a cart error.
  - Every part's outer element has a stable `data-commerce-part` attribute, such as `cart-checkout`, documented as a styling hook. No elements are added or removed.

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
