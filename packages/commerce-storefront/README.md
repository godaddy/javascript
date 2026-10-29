# Commerce storefront

`@godaddy/gd-commerce-storefront` provides complete React storefront templates: a catalog, product details with variant selection, a shared cart, and a cart drawer. Applications import compiled components instead of copying and maintaining their implementation.

This is an opinionated package for React applications that use React Router 7 or 8.3+, TanStack Query 5, and the documented same-origin Commerce API. It works with the host application’s router and query provider and does not require Tailwind configuration.

## Installation

This package is not published yet. Use the local workspace example while reviewing this branch. After the first release, install it with:

```sh
pnpm add @godaddy/gd-commerce-storefront @tanstack/react-query react react-dom react-router
```

Import the stylesheet once. Mount `CommerceStorefront` once inside your application's existing router and query provider. It owns the commerce state and renders one cart drawer. Keep your header and page routes inside it so cart buttons share that state.

#### Example application

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import {
  Catalog, CartButton, CommerceStorefront, ProductDetails,
} from '@godaddy/gd-commerce-storefront';
import '@godaddy/gd-commerce-storefront/styles.css';

const client = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <CommerceStorefront>
          <header><a href='/'>My store</a><CartButton /></header>
          <main>
            <Routes>
              <Route path='/shop' element={<Catalog />} />
              <Route path='/products/:productId' element={<ProductDetails />} />
            </Routes>
          </main>
        </CommerceStorefront>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

Use the providers your application already has; do not create another router or query client for this package. Your server must implement the [server API contract](docs/server-api.md) before these components can load products. Express hosts can mount `@godaddy/gd-commerce-server`; custom servers can implement the contract directly. The host owns store credentials, merchant provisioning, payment readiness, and runtime configuration.

## Configuration

| Option | Default | Meaning |
| --- | --- | --- |
| `catalogPath` | `/shop` | Same-origin catalog route |
| `productPath` | `/products` | Same-origin prefix for product links; register `${productPath}/:productId` |
| `checkoutSuccessPath` | unset | Same-origin return route; enables checkout UI only when supplied |
| `onItemAdded` | unset | Called with `{ name, quantity, isSample }` after each add, live or sample; use it to confirm adds on a site with a cart page instead of a drawer |
| `onEvent` | unset | Called with a [`CommerceEvent`](#events) for every cart change and failure, such as for analytics |
| `locale` | `en-US` | BCP 47 locale for formatting prices, such as `de-DE`; an invalid tag falls back to `en-US` with a development warning. It never selects UI text |
| `theme` | inherited text and transparent wrappers; neutral control palette | CSS custom properties applied to storefront surfaces and the portalled drawer |
| `getSwatch` | unset | Swatches for attribute values, such as colors. Returns a CSS `background` for a value, or nothing. See [swatches](#swatches) |

Provide root-relative paths without a trailing slash. Enable `checkoutSuccessPath` only after your server supports checkout and validates merchant readiness. Mount a corresponding return page. A redirect back from checkout is **not proof of payment**; that page must obtain authoritative payment status from your server. This package does not provide a payment receipt page or merchant onboarding.

`GET /api/commerce/config` supplies the currency and opaque cart scope. The scope must change when the store, channel, or currency binding changes. The draft-order cart displays its subtotal and a row saying that shipping, taxes and discounts are calculated at checkout. The explanation's outer element has the stable `commerce-cart-checkout-adjustments-note` class so applications can hide it when needed. The cart does not create a checkout session or calculate adjustments. Applications do not pass store IDs or credentials into the browser package. One storefront binding is supported per page and query client.

A connection failure leaves the surrounding application and its state mounted. Catalog and product surfaces show the connection error and retry action. Custom integrations can render `CommerceStatus` or inspect `useCommerce().connection`.

#### Example appearance and copy

```tsx
<CommerceStorefront
  catalogPath='/collection'
  productPath='/item'
  theme={{
    '--commerce-accent': '#174c3c',
    '--commerce-accent-hover': '#10362b',
    '--commerce-on-accent': '#ffffff',
    '--commerce-surface': '#ffffff',
    '--commerce-text': '#171717',
    '--commerce-radius': '0.75rem',
    '--commerce-sale': '#b42318',
    '--commerce-on-sale': '#ffffff',
  }}
>
  {/* Register /collection and /item/:productId in your router. */}
  <Catalog />
</CommerceStorefront>
```

The stylesheet includes all required utilities and scopes them to the package's surfaces. The build removes CSS layer wrappers in their declared order, so the exported CSS can pass through a host Tailwind v3 PostCSS pipeline without `@tailwind` directives. Import it directly; consumers do not need to copy or rewrite the CSS. It does not add a global reset or require dependency scanning by a host Tailwind build. The `theme` prop reaches the drawer even though it is portalled into `document.body`.

By default, `.commerce-storefront` wrappers do not paint a background and inherit the host's text color. Set page and section backgrounds on the host application's layout elements. Muted text, hairlines, image placeholders and the quieter outlined buttons (cart button, product card actions, pagination) derive from the inherited text color, so they read on a light or dark page without configuration. `--commerce-surface` colors form inputs and the opaque cart drawer, paired with `--commerce-text`; it does not color component wrappers. Error and warning messages bring their own light background. The Sale badge fills with `--commerce-sale` behind `--commerce-on-sale` text, so it reads over an image and on any page; sale prices keep the surrounding text color, with the compare-at price struck through beside them. Images have square corners; `--commerce-radius` rounds buttons, inputs and option buttons. Primary buttons use `--commerce-accent` and are ringed in it on focus, so choose an accent that contrasts with the page. Set `--commerce-surface` and `--commerce-text` together to adapt controls and the drawer to a dark theme. Avoid setting wrapper backgrounds through CSS or the `theme` prop's `background`, `backgroundColor`, or `backgroundImage` properties, which can still override the transparent default. Descendants inherit the surface text and body font instead of global heading styles. Keep text, controls and focus indicators accessible when changing colors. Internal utility class names and markup are not a customization API; use the [product](#custom-product-layouts), [catalog](#custom-catalog-layouts) and [cart](#custom-cart-layouts) parts to change a layout, and the [styling hooks](#styling-hooks) to style inside a part.

Prices follow the provider's `locale`, which defaults to `en-US`. UI text is English. The catalog title and description are configurable through `CatalogHeader`, and many parts take [replacement text](#replacing-text). Full localization is outside this initial API. When it arrives, translated text will be a separate prop that a site opts into; `locale` will keep formatting only, so a site that sets it for prices never gets new wording in a minor release. Replacement text will still take priority over translations.

## Compatibility

The package supports React Router 7 and React Router 8.3 or later in the 8.x series. The host still owns the router and query client; no integration API changes are needed between these versions.

The repository example uses React Router 7. Follow each router version's own React and browser requirements.

## Components and hooks

| Export | Purpose |
| --- | --- |
| `CommerceStorefront` | Recommended integration: provider and one drawer |
| `Catalog` | Six products per cursor page, or `pageSize`. Its `title`, `description`, and `showHeader` props are deprecated; compose `CatalogRoot` instead |
| `CatalogRoot` and catalog parts | Build a [custom catalog or card layout](#custom-catalog-layouts) with the same rules as `Catalog` |
| `ProductDetails` | Reads `:productId`; validates URL option selections against catalog results. `ProductDetailsRoot` also takes a `productId` prop |
| `ProductDetailsRoot` and product parts | Build a [custom product layout](#custom-product-layouts) with the same rules as `ProductDetails` |
| `ProductCard` | Renders one `SKUGroup` with direct add or a product-details link; `ProductCardRoot` and card parts customize it |
| `RelatedProducts` | Optional: other products from the catalog's first page, for after the product page. See [related products](#related-products) |
| `CartDrawer` | The cart dialog; `CommerceStorefront` mounts one |
| `CartDrawerRoot`, `CartRoot` and cart parts | Build a [custom drawer or a cart page](#custom-cart-layouts) with the same rules as `CartDrawer` |
| `CartButton` | Opens the shared drawer: a bag icon with a count badge, named "Cart, 2 items". Its children replace the icon with a label, and `useCart()` builds a custom one |
| `AddToCartButton` | Adds a verified `sku`, `name`, and optional integer `quantity`; while disabled, its accessible description says why. Its children replace the label |
| `CommerceStatus` | Connection progress/error/retry for custom layouts |
| `useCommerce` | Cart, connection, pending/error state and serialized cart actions |
| `useMoney` | Formats minor units in the provider's `locale`, like the package's own prices, for custom parts |
| `ProductImage` | A product image with the package's placeholder for a missing or broken image, for custom parts |
| `CommerceProvider` | Lower-level composition when the recommended wrapper does not fit, such as a custom drawer; mount it once |

The package exports TypeScript catalog/cart response types and selection/summary helpers for custom product layouts. `useCommerce` actions return `Promise<boolean>`: `false` means an operation failed or its connection became stale. Inspect `error` for active-session failures. Do not automatically retry a failed mutation: the server may have committed it before the response failed. `applyDiscount(code)` is available to custom layouts; the default drawer does not render a promotion form.

`Catalog` renders its title as an H1. When the host page owns its semantic heading, compose `CatalogRoot` without `CatalogHeader` (see [custom catalog layouts](#custom-catalog-layouts)) so the document still has exactly one H1. `Catalog`'s `title`, `description` and `showHeader` props still work but are deprecated: pass the copy to `CatalogHeader`, or leave `CatalogHeader` out.

## Custom product layouts

`ProductDetails` is the recommended product page. When its layout does not fit, compose the same parts inside `ProductDetailsRoot`. The root loads the route's `:productId`, or its `productId` prop, and shows the connection, loading, error and not-found states itself, so parts render only once the product exists. This is the packaged layout, written out:

```tsx
import {
  ProductDetailsBackLink, ProductDetailsBadge, ProductDetailsDescription, ProductDetailsGallery, ProductDetailsPrice,
  ProductDetailsPurchase, ProductDetailsRoot, ProductDetailsTitle,
} from '@godaddy/gd-commerce-storefront';

<ProductDetailsRoot>
  <ProductDetailsBackLink className='mb-4 sm:mb-6' />
  <div className='grid items-start gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12'>
    <div className='relative min-w-0'>
      <ProductDetailsGallery />
      <ProductDetailsBadge className='pointer-events-none absolute left-4 top-4' />
    </div>
    <div className='min-w-0 md:pt-2'>
      <ProductDetailsTitle />
      <ProductDetailsPrice className='mt-2' />
      <ProductDetailsDescription className='mt-6' />
      <ProductDetailsPurchase className='mt-6 border-t border-commerce-line pt-6' />
    </div>
  </div>
</ProductDetailsRoot>
```

The grid, spacing and border classes come from your own stylesheet in a custom layout. Without them, the parts stack in one column with no space between them. `border-commerce-line` and `divide-commerce-line` stand for the package's hairline, the surrounding text color at 14% opacity, which reads on light and dark pages alike; use your own border color in its place.

Add your own elements between parts, reorder them, or leave out display parts. `ProductDetailsBadge` shows "Sale" when the verified SKU's compare-at price is above its price, or before then when some SKU's compare-at price is above that SKU's own price, and nothing otherwise. `ProductDetailsPrice` shows "From" and the starting price until a SKU is verified. It strikes through a compare-at price beside it only when the cheapest SKUs all have that compare-at price, so a strike-through never pairs one SKU's price with another's compare-at price. `ProductDetailsPurchase` renders the options and status, then the quantity and add button in one row, then the availability. Replace it with individual parts to place options apart from the add button:

| Part | Renders |
| --- | --- |
| `ProductDetailsOptions` | A control for every attribute, or the SKU list for products without attributes |
| `ProductDetailsOption` | One attribute, by `attribute` name, as a group of buttons (radios); as swatches when [`getSwatch`](#swatches) gives every value one; or as a select when it has more than eight values. Nothing when the product lacks it |
| `ProductDetailsPurchaseStatus` | The one message explaining why a full selection is not purchasable, such as an unavailable combination; nothing when ready or before every option is chosen |
| `ProductDetailsQuantity` | A quantity stepper, capped at the verified SKU's stock and disabled when it is sold out. It shows a message when a typed quantity cannot be added |
| `ProductDetailsAvailability` | Stock for the verified SKU; nothing before verification |
| `ProductDetailsAddToCart` | Adds the verified SKU and quantity, labeled with the total, such as "Add to cart · $64.00". Until every option is chosen it names the next one, such as "Select size", and pressing it shows an error on each missing option and focuses the first. While a selection is checked or unavailable, it is disabled and its accessible description gives the reason |

Values that no active SKU has are left out, so every value shown can be bought, and a link that names one is treated as if that option is not chosen. An attribute that no SKU has a value for keeps all its values. Values whose SKUs are all sold out, given the shopper's other selections, are crossed out and announced as "sold out", but stay selectable, so the shopper can change options in any order. Both need every SKU with its attribute values in the product response, which `@godaddy/gd-commerce-server` returns for up to 50 SKUs; for a product with more, every value is shown, none is marked, and the add button still says "Out of stock" once a sold-out SKU is chosen.

Every part is named `ProductDetails*` because it works only inside `ProductDetailsRoot`. `AddToCartButton` is the standalone button for a SKU you already have.

The root keeps the selection in the page URL, as `option.<attribute>` and `sku`, so a reload or a shared link keeps it. To show a product outside its route, such as in a quick view or next to another product, pass `productId` and set `urlState={false}`. That root keeps its selection to itself, and it ends when the root unmounts. Give every root but one on a page `urlState={false}`; otherwise the roots share one selection. A root with no `productId` on a route without `:productId` shows the not-found state and, in development builds, warns.

```tsx
{/* Your own dialog, opened from a card with the product's ID. */}
<QuickViewDialog open={quickViewId !== null} onClose={() => setQuickViewId(null)}>
  {quickViewId && (
    <ProductDetailsRoot productId={quickViewId} urlState={false} loading={<p role='status'>Loading…</p>}>
      <ProductDetailsTitle />
      <ProductDetailsPrice />
      <ProductDetailsPurchase />
    </ProductDetailsRoot>
  )}
</QuickViewDialog>
```

`loading` and `notFound` replace those states. `error` replaces the load failure; as a function, it receives `{ message, retry }`. Replacement content renders inside the root's element, which keeps its `className`, and the error keeps `role='alert'`; a replacement loading message should have its own `role='status'`.

Parts read state from the root and take no product, SKU, price or quantity props. Whatever the layout, only a server-verified SKU can be added, and changing a selection resets the image but keeps the quantity. A quantity above the new SKU's stock shows an error under the field and disables the add button. Every part throws if it is rendered outside `ProductDetailsRoot`. In development builds, if no control is rendered for an attribute the product requires, a console warning names the missing ones. A control that mounts later, such as one in a closed accordion, can trigger it; the product becomes purchasable once the control renders. Products without attributes but with several SKUs need `ProductDetailsOptions` or `ProductDetailsPurchase`. Parts can be rendered more than once, such as in a sticky mobile purchase bar; each copy gets its own element IDs.

Every part accepts `className`, which is added to the part's outer element, a wrapper the package's CSS reset leaves alone. Host classes there control margin, padding, border, color, width, display, gap and grid placement, including layered utilities such as Tailwind v4's. In `ProductDetailsOptions` and `ProductDetailsPurchase`, each control keeps a 24px bottom margin, even in a host grid. The exception is a class name the package also uses, such as `grid-cols-1` or `p-6`: the package's rule wins, even over the host's responsive variants on the same element, such as `md:grid-cols-4`. The packaged layout sets its spacing and grid placement this way. Elements inside the part, such as the title's `<h1>`, keep the package's own styles: a host font size on `ProductDetailsTitle` does not change the heading's size, but a host color does reach it, because the heading inherits its color.

Your own elements inside a root are a limit for now. The package's unlayered reset matches every element inside a root that is not a part's outer element, so layered host styles lose there:
- **Color, font family and border** on any element.
- **Margin, padding, font size and weight** on headings, paragraphs, lists and fieldsets.
- **Font, color, background and border radius** on buttons, inputs and selects. Custom controls such as the swatches below are affected.

Until the package scopes its reset, you can work around it:
- Keep page headings outside the root.
- Put colors on a part's `className`, which its children inherit.
- Mark the affected declarations `!important`; a layered `!important` beats unlayered CSS.

A part that renders nothing, such as `ProductDetailsAvailability` before a SKU is verified, leaves no grid cell, so the cells after it move up in a host grid. Wrap such parts in your own element or use named grid areas.

Two hooks support custom parts inside the root:

- `useProductDetails()` returns read-only `product`, `name`, `selectedSku`, `quantity`, `availableQuantity`, `images` and `status` (`incomplete`, `checking`, `variant-error`, `unavailable`, `not-purchasable` or `ready`). `selectedSku` is set only when `status` is `ready`.
- `useProductDetailsOption(attribute)` returns `{ name, label, selected, missing, values, select }` for building swatches or buttons, or `null` when the product has no such attribute. Each value has `name`, `label`, `selected`, `soldOut` and `swatch` (from `getSwatch`, or `null`). `missing` is `true` once the shopper has pressed add without choosing this option, so the control can show an error; mark the control's element with `data-commerce-missing` to have add focus it. `select(value)` accepts only that attribute's value names, or `null` to clear. Other values are ignored. A hook-based control counts toward the layout check.

```tsx
function ColorSwatches() {
  const color = useProductDetailsOption('color');
  if (!color) return null;
  return (
    <div role='group' aria-label={color.label}>
      {color.values.map((value) => (
        <button key={value.name} type='button' aria-pressed={value.selected} onClick={() => color.select(value.name)}>
          {value.label}
          {value.soldOut && ' (sold out)'}
        </button>
      ))}
    </div>
  );
}
```

Parts are flat named exports, not properties such as `ProductDetails.Title`, so each one is an ordinary module export.

### Swatches

Swatches are off by default: attribute values have no color or image in the catalog. Pass the provider a `getSwatch` function that returns a CSS `background` for a value, such as `'#3f6352'` or `'url(/swatches/linen.png) center / cover'`. An attribute whose values all get one renders as swatches on the product page, with the value's label as its accessible name, and catalog cards show it as dots. Any other attribute keeps its buttons.

```tsx
const colors: Record<string, string> = { forest: '#3f6352', black: '#1a1a1a', white: '#f7f7f5' };

<CommerceStorefront getSwatch={({ attribute, name }) => (attribute === 'color' ? colors[name] : undefined)}>
```

### Related products

`RelatedProducts` is optional and separate from `ProductDetails`. Place it where it fits, such as after the product page. It shows packaged cards for the catalog's first products, leaving out the route's `:productId` or its `productId` prop. There is no related-products API, so the products are not chosen for the current one.

```tsx
<Route
  path='/products/:productId'
  element={
    <>
      <ProductDetails />
      <RelatedProducts className='mt-16 border-t border-commerce-line pt-12' />
    </>
  }
/>
```

`title` replaces "You may also like", `limit` sets the most products, from 1 to 24 (default 4), and children replace the card, as in `CatalogProducts`. It renders nothing until the products load, when no others are left, if the request fails, or while no store is connected.

## Custom catalog layouts

`Catalog` is the recommended catalog. When its layout or its cards do not fit, compose the same parts inside `CatalogRoot`. The root loads one cursor page of six products, or `pageSize` products, or the built-in samples when `sampleProducts` is set and no store is connected, and shows the connection state itself. This is `<Catalog sampleProducts />` written out with its packaged card:

```tsx
import {
  CatalogHeader, CatalogPagination, CatalogProducts, CatalogRoot, CatalogSummary, ProductCardAction, ProductCardBadge,
  ProductCardImage, ProductCardPrice, ProductCardRoot, ProductCardSwatches, ProductCardTitle,
} from '@godaddy/gd-commerce-storefront';

<CatalogRoot sampleProducts>
  <div className='flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pb-6 pt-4 sm:pb-8 sm:pt-8'>
    <CatalogHeader />
    <CatalogSummary />
  </div>
  <CatalogProducts className='grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] lg:gap-y-12'>
    <ProductCardRoot className='flex min-w-0 flex-col'>
      <div className='relative'>
        <ProductCardImage />
        <ProductCardBadge className='pointer-events-none absolute left-3 top-3' />
      </div>
      <div className='flex flex-1 flex-col pt-3'>
        <ProductCardTitle />
        <ProductCardPrice className='mt-0.5' />
        <ProductCardSwatches className='mt-2' />
        <ProductCardAction className='mt-auto pt-4' />
      </div>
    </ProductCardRoot>
  </CatalogProducts>
  <CatalogPagination className='mt-12 border-t border-commerce-line pt-6' />
</CatalogRoot>
```

As with product layouts, the grid, spacing and border classes come from your own stylesheet in a custom layout. Without them, the cards stack in one column.

| Part | Renders |
| --- | --- |
| `CatalogHeader` | The `title` as the page's H1 and a `description`; leave it out when the host page owns the H1 |
| `CatalogSummary` | The loading, failure or product-count status line |
| `CatalogProducts` | One card per product. Its children are the card, rendered once for each product; without children, the packaged card |
| `CatalogEmpty` | Only when the store's catalog has no products: "No products available.", or its own children instead. While one is mounted, `CatalogProducts` leaves out its own empty message. Samples are never empty |
| `CatalogPagination` | First-page and next-page buttons; nothing when there is one page, or for samples |
| `ProductCardImage`, `ProductCardTitle` | The first image and the name as an H2, each linked to the product page. With a title in the card, keyboard and screen reader users get only the title link; without one, the image link takes its place once the page is interactive |
| `ProductCardBadge` | "Sale" when some SKU's compare-at price is above that SKU's price. The catalog list has no SKU prices, so there it shows only when the lowest compare-at price is above the highest price |
| `ProductCardPrice` | The price or price range. A single price on sale shows its compare-at price struck through; a range does not |
| `ProductCardSwatches` | Dots for the first attribute whose values all have a [swatch](#swatches); nothing without `getSwatch` |
| `ProductCardDescription` | Up to two lines of description; nothing without one. The packaged card leaves it out |
| `ProductCardAction` | Adds the product directly only when it has one SKU and no options; otherwise links to the product page to choose. Its children replace the label; as a function, they receive the `action`: `add`, `choose-options` or `view-product` |

`className` on `CatalogProducts` goes on the element whose direct children are the cards, so a host grid places them, and `className` on `ProductCardRoot` goes on each card, so classes such as `col-span-2` work. While products load, that element holds three placeholder cards, so they follow the host's grid. The error with its retry button and, without a `CatalogEmpty`, the empty message render just before it. Card parts take no product, SKU or price props. Inside `CatalogProducts`, `ProductCardRoot` takes no `product` prop either and throws if it gets one, so a card always shows the product it is rendered for. Samples use the same card: they show a placeholder image, no badge, description or links, and add only to the sample cart. Card and catalog parts throw if they are rendered outside their root. Packaged cards fill their grid row, with the price and action at the bottom of each card.

The root keeps its page cursor in the page URL, as `after`. For a second catalog on the same page, such as a featured row above the main grid, set `urlState={false}` on it so the two do not share one cursor.

For a product the host already has, such as a featured product, use `ProductCard` or `ProductCardRoot` with a `product` prop outside the catalog. `useProductCard()` returns read-only `product` (`null` for samples), `name`, `href` (`null` for samples) and `isSample` for building custom card parts. Every part accepts `className` on an outer wrapper that the package's CSS reset leaves alone, with the same limits as [product parts](#custom-product-layouts).

## Custom cart layouts

`CartDrawer` is the recommended cart. `CommerceStorefront` mounts it. When its layout does not fit, use `CommerceProvider` and mount your own `CartDrawerRoot` once in its place. Development builds warn when more than one drawer is mounted, because every add would open all of them. It opens when an item is added or a `CartButton` is pressed and returns focus when it closes, like the packaged drawer. This is `CartDrawer` written out:

```tsx
import {
  CartCheckout, CartCheckoutNote, CartClose, CartContinueShopping, CartDescription, CartDrawerRoot, CartEmpty,
  CartItemImage, CartItemName, CartItemOptions, CartItemPrice, CartItemQuantity, CartItemRemove, CartItemRoot, CartItems,
  CartNotices, CartSubtotal, CartSummary, CartTitle, CommerceProvider, useCart,
} from '@godaddy/gd-commerce-storefront';

// Only the sample cart needs a description: it says nothing can be bought.
function SampleDescription() {
  return useCart().isSample ? <CartDescription className='mt-0.5' /> : null;
}

<CommerceProvider>
  {/* Header and routes */}
  <CartDrawerRoot className='flex w-full max-w-md flex-col bg-white text-neutral-900 shadow-2xl'>
    <div className='flex items-start justify-between gap-4 border-b border-commerce-line py-3 pl-6 pr-3'>
      <div className='min-w-0 pt-2.5'>
        <CartTitle />
        <SampleDescription />
      </div>
      <CartClose />
    </div>
    <div className='flex-1 overflow-y-auto px-6'>
      <CartNotices className='mt-6' />
      <CartItems className='divide-y divide-commerce-line'>
        <CartItemRoot className='flex gap-4 py-5'>
          <CartItemImage className='shrink-0' />
          <div className='flex min-w-0 flex-1 flex-col'>
            <div className='flex items-start justify-between gap-4'>
              <div className='min-w-0'>
                <CartItemName />
                <CartItemOptions />
              </div>
              <CartItemPrice className='shrink-0' />
            </div>
            <div className='mt-3 flex items-center justify-between gap-2'>
              <CartItemQuantity />
              <CartItemRemove />
            </div>
          </div>
        </CartItemRoot>
      </CartItems>
      <CartEmpty className='py-20 text-center' />
    </div>
    <CartSummary className='border-t border-commerce-line px-6 pb-6 pt-4'>
      <CartSubtotal />
      <CartCheckoutNote className='mt-1' />
      <CartCheckout className='mt-5' />
      <CartContinueShopping className='mt-2' />
    </CartSummary>
  </CartDrawerRoot>
</CommerceProvider>
```

`className` on `CartDrawerRoot` goes on the dialog panel, which sits at the right edge at full height. The packaged width, background and column layout are the classes above; without them the panel is only as wide as its content and has no background. Give the panel a background and a text color together, as `bg-white text-neutral-900` do here with `--commerce-surface` and `--commerce-text`, so the parts inside can derive their muted text and lines from it. The packaged drawer also slides in, unless the visitor prefers reduced motion. Add `mr-auto` to open it from the left. Keep `CartTitle` in a drawer: it names the dialog, and the dialog library logs an error without it. `CartDescription` is optional and describes the dialog when present. Render each of them once per drawer, because they use the dialog's own element IDs.

For a cart page instead of, or as well as, the drawer, compose the same parts inside `CartRoot` on a route such as `/cart`. It shows the connection state itself, and `CartClose` renders nothing there. If the site has no drawer, use `CommerceProvider` without `CartDrawerRoot` and link to the page instead of rendering `CartButton`. Adds then open nothing, and `useCommerce().open` stays `false`. Confirm adds with the provider's `onItemAdded`, for example with a toast that links to the cart.

```tsx
<h1>Your cart</h1>
<CartRoot className='grid gap-8 lg:grid-cols-3'>
  <div className='lg:col-span-2'>
    <CartNotices className='mb-4' />
    <CartItems className='divide-y divide-commerce-line' />
    <CartEmpty className='py-16 text-center' />
  </div>
  <CartSummary className='rounded-lg border border-commerce-line p-6'>
    <CartSubtotal />
    <CartCheckoutNote className='mt-3' />
    <CartCheckout className='mt-6' />
  </CartSummary>
</CartRoot>
```

| Part | Renders |
| --- | --- |
| `CartTitle`, `CartDescription` | "Your cart" as an H2, with the item count once there are items, and one line about it; sample wording before a store is connected |
| `CartClose` | The drawer's close button; nothing outside the drawer |
| `CartNotices` | A storage warning, and a cart error with a refresh button; nothing when there are neither |
| `CartItems` | The cart lines as a list. Its child is the item, rendered once for each line; without one, the packaged item. "Loading your cart…" renders just before the list while the saved cart loads |
| `CartItemImage`, `CartItemName`, `CartItemOptions`, `CartItemPrice` | The line's image (nothing without one), name as an H3, selected options on one line, such as "Color: Blue · Size: M" (nothing without any), and line total |
| `CartItemQuantity`, `CartItemRemove` | Decrease and increase buttons around the quantity, and the remove button |
| `CartEmpty` | Only when the cart is empty: a bag icon, a message and a link to the catalog, or its own children instead |
| `CartSummary` | A container that renders only when the cart has items |
| `CartSubtotal`, `CartCheckoutNote` | The subtotal, and a row saying shipping, taxes and discounts are calculated at checkout. The note's outer element keeps the `commerce-cart-checkout-adjustments-note` class |
| `CartCheckout` | The checkout button when `checkoutSuccessPath` is set; otherwise a message that checkout is unavailable. Samples never check out |
| `CartContinueShopping` | "Continue shopping", which closes the drawer, or links to the catalog on a cart page; nothing for an empty cart |

`className` on `CartItems` goes on the list element whose direct children are the items, and `className` on `CartItemRoot` goes on each item. The list is a `role='list'` element rather than a `<ul>`, so it has no browser margin or indent for a package rule to reset. Cart and item parts take no item, quantity or price props, and they throw if they are rendered outside their root. In development builds, an item template without a `CartItemRoot` logs a warning, because the list would have no items. `CartItemImage` and `CartItemOptions` render nothing for a line without an image or options, which moves the line's other cells in a host grid. Every cart action goes through the shared provider's queue, whatever the layout, and while no store is connected the parts show the sample cart, which never reaches the store. Every part accepts `className` on an outer wrapper that the package's CSS reset leaves alone, with the same limits as [product parts](#custom-product-layouts).

Two hooks support custom cart markup:

- `useCart()` works anywhere inside `CommerceProvider`. It returns read-only `items`, `itemCount`, `subtotal` (minor units, or `null` when the server has not priced the cart), `currency`, `isSample` and `loading`. Combine `itemCount` with `useCommerce().setOpen(true)` for a custom cart button.
- `useCartItem()` returns the line inside `CartItemRoot`: `id`, `name`, `quantity`, `imageUrl`, `options`, `subtotal` and `currency`.

## Replacing text

The package has one rule for replacing content, so a layout never has to guess:

- **A part's own text** is the part's children, such as `<CartTitle>Your bag</CartTitle>`.
- **A state inside a loaded root**, such as an empty cart or an empty catalog, is its own part that renders only in that state: `CartEmpty` and `CatalogEmpty`. Place it anywhere in the layout.
- **A state before the root has anything to show**, such as loading, not found or a load failure, is a root prop: `ProductDetailsRoot`'s `loading`, `notFound` and `error`. Like `<Suspense fallback>`, it replaces the root's content, because the root's children render only once its data exists. That is why `useProductDetails()` can always return a product.

Parts whose wording a site often changes take replacement content as children. The part keeps its element, accessibility and rules: a replaced checkout label still waits for the cart total and still blocks a second click. As a function, the children receive the part's state, so the label can change with it. Content that is empty, such as `null`, `false`, blank text or an empty fragment, falls back to the package text. The package cannot see what a component of yours renders, so a label component that returns `null` leaves the control unlabeled. Make that choice in the children function instead, which can return `null` to keep the package text.

```tsx
<CartCheckout>{({ busy }) => (busy ? 'Redirecting…' : 'Pay securely')}</CartCheckout>
<CartButton>{({ itemCount }) => `Bag (${itemCount})`}</CartButton>
<ProductDetailsAddToCart>{({ soldOut }) => (soldOut ? 'Sold out' : 'Add to bag')}</ProductDetailsAddToCart>
```

| Part | Function receives |
| --- | --- |
| `CartTitle`, `CartDescription`, `CartContinueShopping` | `{ isSample }` |
| `CartCheckout`, `CartItemRemove` | `{ busy }` |
| `CartButton` | `{ itemCount }`. Replaces the icon and badge with a visible label; keep the count in it |
| `AddToCartButton`, `ProductDetailsAddToCart` | `{ busy, soldOut }`. A `ProductDetailsAddToCart` label also replaces "Select size" and the total |
| `ProductCardAction` | `{ action, busy, soldOut }` |
| `ProductDetailsBackLink` | Content only |

A replaced label stays the start of the control's accessible name, so voice control users can say what they see. Where the package adds the product name for screen readers, it follows as visually hidden text: `<CartItemRemove>Delete</CartItemRemove>` is named "Delete Mug". Controls without replacement text, such as "Increase quantity of Mug", keep English names.

## Styling hooks

Every part's outer element has a `data-commerce-part` attribute with the part's name in kebab case, such as `cart-checkout` or `product-details-option`. Roots have one too, such as `product-details-root`, including while they show the connection, loading or error state. `CartButton` and add-to-cart buttons have `cart-button` and `add-to-cart-button` on the button itself. These names, and the controls' standard state attributes (`disabled`, `aria-busy`, `aria-pressed`, `aria-invalid`, `aria-expanded`), are a stable styling API; utility classes and other markup are not.

```css
.commerce-storefront [data-commerce-part='cart-checkout'] button { border-radius: 9999px; }
.commerce-storefront [data-commerce-part='cart-checkout'] button[aria-busy='true'] { opacity: 0.7; }
.commerce-storefront [data-commerce-part='product-details-option'][data-commerce-attribute='color'] { display: none; }
```

`ProductDetailsOption` also has `data-commerce-attribute` with its attribute name. Controls inside a part that has more than one have `data-commerce-control`: `decrease` and `increase` in `CartItemQuantity` and `ProductDetailsQuantity`, `choice` on each option radio, and `thumbnail` in `ProductDetailsGallery`. An option the shopper skipped before pressing add has `data-commerce-missing` on its part, and its controls have `aria-invalid`. The package's utilities are unlayered and have the specificity of two classes, such as `.commerce-storefront .w-full`, or three with a state such as `:hover`. To override one, write unlayered CSS that starts with `.commerce-storefront` and a part attribute, and add the same state when the utility has one, as above. Layered host CSS, such as Tailwind v4 utilities, loses to the package's unlayered rules whatever its specificity.

## Events

`onEvent` on `CommerceProvider` or `CommerceStorefront` receives every cart change once the server has returned the updated cart, and every cart failure. Sample-cart changes have `isSample: true` and never reach the store.

| `type` | Fields |
| --- | --- |
| `item-added` | `skuId` (`null` for samples), `name`, `quantity`, `isSample` |
| `quantity-changed` | `itemId`, `quantity`, `isSample` |
| `item-removed` | `itemId`, `isSample` |
| `discount-applied` | `code` |
| `checkout-started` | `cartId`; sent just before the browser leaves for checkout, so use `navigator.sendBeacon` or a keepalive request |
| `error` | `operation` (`add`, `change-quantity`, `remove`, `discount`, `refresh` or `checkout`) and the `message` the cart shows |

New event types may be added in minor releases, so ignore types you do not handle. A callback that throws or returns a rejected promise, including `onItemAdded`, is logged to the console and does not fail the cart operation. Async callbacks are not awaited, so a slow analytics call never delays the cart.

## How it works

Products are SKU groups. The package purchases only an unambiguous SKU, verifies all selected attributes through the server, uses SKU prices/images, and distinguishes untracked inventory from sold-out inventory. Server-side inventory and pricing checks remain mandatory.

Cart mutations share one queue, including initial cart creation. The cart ID is saved under `godaddy:commerce-storefront:cart:<scope>`. Browser Web Locks coordinate tabs where supported; storage/focus events refresh the cart. If storage fails, the current page keeps the cart ID in memory and shows a warning. Browsers without Web Locks have only per-provider serialization; the server must handle concurrent writes correctly.

Changing the server-provided cart scope resets cart state and prevents old responses from affecting the new connection. A failed configuration refresh temporarily disables commerce and also invalidates pending responses. Normal configuration loading and failures do not unmount host content.

## Guides

- [Server API contract](docs/server-api.md)
- [Independent Vite consumer](../../examples/commerce-storefront/README.md)

## Commands

From the repository root, with Node 24:

```sh
pnpm install
pnpm --filter @godaddy/gd-commerce-storefront build
pnpm --filter @godaddy/gd-commerce-storefront typecheck
pnpm --filter @godaddy/gd-commerce-storefront lint
pnpm --filter @godaddy/gd-commerce-storefront test
pnpm --filter commerce-storefront-example build
pnpm --filter commerce-storefront-example dev
```

Build before testing: artifact tests check the compiled JavaScript and shipped CSS as well as source behavior. The build uses local locked tool versions. Nothing in these commands publishes the package.

## License

[MIT](LICENSE.md).

### Before a store is connected

A site can mount the same components before it has a connected store:

```tsx
<CommerceStorefront theme={theme}>
  <Header><CartButton /></Header>
  <Catalog sampleProducts />
</CommerceStorefront>
```

`Catalog.sampleProducts` defaults to `false`. It allows six built-in sample products
(Product 1–6, $10–$60 USD) **only** when `/api/commerce/config` reports `state: 'unbound'`.
When a store is connected, the server reports a different state and the components show real
products. You do not need to change props or the component tree. The prop has no effect while
a store is connected. Real empty catalogs and errors never fall back to samples.

The sample cart supports adding items, changing quantities (1–999), removing items, and an
example subtotal. It uses the existing drawer and theme, keeps its items during navigation under
the shared provider, and resets on reload, unmount, or any change away from `unbound`. It uses no
live cart storage and makes no product, cart, checkout, or upstream Commerce requests.
Configuration reads continue. Sample entries are not SKUs or draft orders and never move into a
real cart. Checkout is unavailable, including direct `useCommerce().checkout()` calls.

`useCommerce().connection` now includes `unbound` and `connecting` in addition to `loading`,
`ready`, and `error`. Only `ready` means a usable store connection. The public `cart` and live
mutation methods apply only to the connected store; sample cart data is internal. A catalog
without `sampleProducts`, and direct product-detail visits, show the unconnected state.
Sample grids and drawers have the attribute `data-commerce-source="sample"`.

The provider reads configuration on mount and focus. While the page is visible and the state is
`unbound` or `connecting`, it also polls every five seconds for five minutes after the page loads,
then every minute, and stops thirty minutes after load. Reloading, retrying or a change in the
reported state starts it again. A page still `connecting` when polling stops shows an error with
"Retry connection". The first
failed refresh hides samples and clears the sample cart; a later `unbound` response starts an
empty sample cart. While connecting, refresh failures keep the connecting
state for up to 60 seconds before showing the error. Once polling slows to every minute, the next
failure is already 60 seconds after the last success, so it shows the error at once. Polling
stops when the state is `ready`; focus and explicit retry still refresh configuration.

Use a server that reports connection state before you enable `sampleProducts`. Successful
config responses without `state` still mean ready. A server that does not report `unbound`
never shows samples. See the [server contract](docs/server-api.md) for the host's
responsibilities.
