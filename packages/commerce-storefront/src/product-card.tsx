import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router';
import { AddToCart, type AddToCartLabelState } from './cart';
import {
  getPrimaryImageUrl,
  getProductAttributes,
  getProductName,
  getSingleMatchedSku,
  getStartingCompareAt,
  inSentence,
  isProductOnSale,
  type PriceRange,
  type SKU,
  type SKUGroup,
} from './catalog-model';
import { saleBadgeClass, secondaryButtonClass } from './class-names';
import { useCommerce, useMoney } from './commerce-provider';
import { type PartLabel, type PartRegistry, partProps, renderLabel, usePartRegistry } from './part';
import { type SampleProduct, useSampleCart } from './sample-cart';
import { StorefrontSurface } from './storefront-surface';

export interface ProductImageProps {
  url?: string | null;
  /** The alt text. Pass `''` for a decorative image, such as a thumbnail next to the product name. */
  name: string;
  /** Added to the image, or to its placeholder. */
  className?: string;
}

/**
 * A product image that fills its container, with a labeled placeholder when there is no URL or it fails to load.
 * Use it in custom parts so they handle missing images like the package's own.
 */
export function ProductImage({ url, name, className = '' }: ProductImageProps): ReactElement {
  // Keyed by URL, so a new URL after a failure is requested instead of keeping the placeholder.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return url && url !== failedUrl ? (
    <img
      src={url}
      alt={name}
      loading='lazy'
      className={`h-full w-full object-cover ${className}`}
      onError={() => setFailedUrl(url)}
    />
  ) : (
    <div
      className={`flex h-full min-h-44 items-center justify-center bg-commerce-tint p-6 text-center text-sm text-commerce-muted ${className}`}
      role='img'
      aria-label={`${name}: image unavailable`}
    >
      No image available
    </div>
  );
}

/** One catalog entry: a product from the server, or a built-in sample while no store is connected. */
export type ProductCardItem =
  | { source: 'live'; product: SKUGroup }
  | { source: 'sample'; sample: SampleProduct };

/** Set by `CatalogProducts` for each entry it renders, so the card template needs no product prop. */
export const CatalogItemContext = createContext<ProductCardItem | null>(null);

/** Read-only card state for custom parts rendered inside `ProductCardRoot`. */
export interface ProductCardState {
  /** `null` for a built-in sample, which is not a catalog product. */
  readonly product: SKUGroup | null;
  readonly name: string;
  /** The product page, or `null` for a sample, which has none. */
  readonly href: string | null;
  readonly isSample: boolean;
}

interface ProductCardLinks {
  /** Whether the image link is the card's product link: only when no `ProductCardTitle` link is rendered. */
  imageLinked: boolean;
  register: (key: string) => () => void;
}

type ProductCardInternal = ProductCardState &
  ProductCardLinks &
  (
    | { source: 'live'; product: SKUGroup; href: string }
    | { source: 'sample'; sample: SampleProduct; product: null; href: null }
  );

const titleLink = 'title-link';

function cardValue(item: ProductCardItem, productPath: string, links: ProductCardLinks): ProductCardInternal {
  if (item.source === 'sample')
    return {
      ...links,
      source: 'sample',
      sample: item.sample,
      product: null,
      name: item.sample.name,
      href: null,
      isSample: true,
    };
  return {
    ...links,
    source: 'live',
    product: item.product,
    name: getProductName(item.product),
    href: `${productPath}/${encodeURIComponent(item.product.id ?? '')}`,
    isSample: false,
  };
}

/** Props shared by every card part. `className` is added to the part's outer element. */
export interface ProductCardPartProps {
  className?: string;
}

const ProductCardContext = createContext<ProductCardInternal | null>(null);

function useProductCardInternal(part: string): ProductCardInternal {
  const context = useContext(ProductCardContext);
  if (!context) throw new Error(`${part} must be rendered inside <ProductCardRoot>.`);
  return context;
}

/** Read the card's product, name, and link from inside `ProductCardRoot`. */
export function useProductCard(): ProductCardState {
  const { product, name, href, isSample } = useProductCardInternal('useProductCard');
  return useMemo(() => ({ product, name, href, isSample }), [product, name, href, isSample]);
}

export interface ProductCardRootProps {
  children: ReactNode;
  /** The catalog product to show. Leave it out inside `CatalogProducts`, which supplies each product. */
  product?: SKUGroup;
  /** Added to the root `<article>`. */
  className?: string;
}

/** Provides one product to card parts. Inside `CatalogProducts` it renders the current catalog entry. */
export function ProductCardRoot({ children, product, className }: ProductCardRootProps): ReactElement {
  const catalogItem = useContext(CatalogItemContext);
  const { config } = useCommerce();
  // The image link starts hidden, so server HTML and the first render have one product link per card. A card
  // with no title link exposes it once mounted. Parent effects run after child effects, so titles have registered.
  const [imageLinked, setImageLinked] = useState<boolean>(false);
  const { register, has } = usePartRegistry(
    useCallback((registered: PartRegistry['has']) => setImageLinked(!registered(titleLink)), []),
  );
  useEffect(() => {
    setImageLinked(!has(titleLink));
  }, [has]);
  const value = useMemo((): ProductCardInternal | null => {
    const item: ProductCardItem | null = catalogItem ?? (product ? { source: 'live', product } : null);
    return item && cardValue(item, config.productPath, { imageLinked, register });
  }, [catalogItem, product, config.productPath, imageLinked, register]);
  if (catalogItem && product)
    throw new Error(
      'Inside <CatalogProducts>, ProductCardRoot shows each catalog product. Remove its product prop.',
    );
  if (!value) throw new Error('ProductCardRoot needs a product prop outside <CatalogProducts>.');
  const card: ReactElement = (
    <ProductCardContext.Provider value={value}>
      {/* `group` drives the image hover zoom. A card nested inside this one is not a catalog entry. */}
      <article {...partProps('product-card-root', 'group', className)}>
        <CatalogItemContext.Provider value={null}>{children}</CatalogItemContext.Provider>
      </article>
    </ProductCardContext.Provider>
  );
  // Inside the catalog the article is the grid item, so host classes such as `col-span-2` place it.
  return catalogItem ? card : <StorefrontSurface>{card}</StorefrontSurface>;
}

/**
 * The product's first image, linked to its page. Samples show a placeholder. With a `ProductCardTitle` in the card,
 * the title is the one link keyboard and screen reader users get; without one, the image link is.
 */
export function ProductCardImage({ className }: ProductCardPartProps): ReactElement {
  const card = useProductCardInternal('ProductCardImage');
  return (
    <div {...partProps('product-card-image', className)}>
      {card.source === 'live' ? (
        <Link
          to={card.href}
          tabIndex={card.imageLinked ? undefined : -1}
          aria-hidden={card.imageLinked ? undefined : 'true'}
          className='block aspect-square overflow-hidden bg-commerce-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current'
        >
          <ProductImage
            url={getPrimaryImageUrl(card.product)}
            name={card.name}
            className='motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]'
          />
        </Link>
      ) : (
        <div aria-hidden='true' className='flex aspect-square items-center justify-center bg-commerce-tint'>
          <div className='h-16 w-16 rounded-full border border-commerce-line' />
        </div>
      )}
    </div>
  );
}

/** The product name as an H2, linked to its page. */
export function ProductCardTitle({ className }: ProductCardPartProps): ReactElement {
  const { name, href, register } = useProductCardInternal('ProductCardTitle');
  useEffect(() => (href ? register(titleLink) : undefined), [href, register]);
  return (
    <div {...partProps('product-card-title', className)}>
      <h2 className='break-words text-base font-medium leading-6'>
        {href ? (
          <Link
            className='rounded-sm text-inherit underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current'
            to={href}
          >
            {name}
          </Link>
        ) : (
          name
        )}
      </h2>
    </div>
  );
}

/** Up to three lines of the product description. Renders nothing without one. */
export function ProductCardDescription({ className }: ProductCardPartProps): ReactElement | null {
  const { product } = useProductCardInternal('ProductCardDescription');
  if (!product?.description) return null;
  return (
    <div {...partProps('product-card-description', className)}>
      <p className='line-clamp-2 text-sm leading-6 text-commerce-muted'>{product.description}</p>
    </div>
  );
}

const formatRange = (
  range: PriceRange | null | undefined,
  money: (value: number) => string,
): string | null => {
  const min: number | null | undefined = range?.min;
  const max: number | null | undefined = range?.max;
  if (typeof min !== 'number') return null;
  return `${money(min)}${typeof max === 'number' && max !== min ? ` – ${money(max)}` : ''}`;
};

/**
 * "Sale" when some SKU's compare-at price is above that SKU's price. Without SKU prices, as in the catalog list, only
 * when the lowest compare-at price is above the highest price. Renders nothing otherwise, or for samples.
 */
export function ProductCardBadge({ className }: ProductCardPartProps): ReactElement | null {
  const { product } = useProductCardInternal('ProductCardBadge');
  if (!isProductOnSale(product)) return null;
  return (
    <div {...partProps('product-card-badge', className)}>
      <span className={saleBadgeClass}>Sale</span>
    </div>
  );
}

/** The product's price, or its price range when variants differ. A single price on sale shows its compare-at price. */
export function ProductCardPrice({ className }: ProductCardPartProps): ReactElement {
  const card = useProductCardInternal('ProductCardPrice');
  const money = useMoney();
  const text: string =
    card.source === 'sample'
      ? money(card.sample.price, 'USD')
      : (formatRange(card.product.priceRange, money) ?? 'Price unavailable');
  // A range has no single compare-at price that belongs to it, so only a single price is struck through.
  const range: PriceRange | null | undefined = card.source === 'live' ? card.product.priceRange : null;
  const starting: number | null =
    card.source === 'live' && range?.min === range?.max ? getStartingCompareAt(card.product) : null;
  const compareAt: string | null = starting === null ? null : money(starting);
  return (
    <div {...partProps('product-card-price', className)}>
      <p className='flex flex-wrap items-baseline gap-x-2 text-sm leading-6 tabular-nums'>
        <span className='font-medium'>{text}</span>
        {compareAt && (
          <>
            <span className='sr-only'>Was</span>
            <del className='text-commerce-muted'>{compareAt}</del>
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Dots for the first attribute whose values all have a swatch from the provider's `getSwatch`, such as colors.
 * Renders nothing without `getSwatch`, for samples, or when no attribute has swatches.
 */
export function ProductCardSwatches({ className }: ProductCardPartProps): ReactElement | null {
  const { product } = useProductCardInternal('ProductCardSwatches');
  const { getSwatch } = useCommerce();
  if (!getSwatch || !product) return null;
  for (const attribute of getProductAttributes(product)) {
    const swatches = attribute.values.map((value) => ({
      ...value,
      background: getSwatch({ attribute: attribute.name, name: value.name, label: value.label }),
    }));
    if (!swatches.length || swatches.some((swatch) => !swatch.background)) continue;
    const shown = swatches.slice(0, 5);
    return (
      <div {...partProps('product-card-swatches', className)}>
        <p className='flex items-center gap-1.5 text-xs text-commerce-muted'>
          <span className='sr-only'>
            {swatches.length} {inSentence(attribute.label)} options:{' '}
            {swatches.map((swatch) => swatch.label).join(', ')}
          </span>
          {shown.map((swatch) => (
            <span
              key={swatch.name}
              aria-hidden='true'
              className='h-3.5 w-3.5 rounded-full border border-commerce-edge'
              style={{ background: swatch.background ?? undefined }}
            />
          ))}
          {swatches.length > shown.length && (
            <span aria-hidden='true'>+{swatches.length - shown.length}</span>
          )}
        </p>
      </div>
    );
  }
  return null;
}

/** What a card action label can depend on. Only `add` can be busy or sold out. */
export interface ProductCardActionLabelState extends AddToCartLabelState {
  /** `add` adds directly; `choose-options` and `view-product` link to the product page. */
  readonly action: 'add' | 'choose-options' | 'view-product';
}

export interface ProductCardActionProps extends ProductCardPartProps {
  /** Replaces the button or link label. A function receives the action and its state. */
  children?: PartLabel<ProductCardActionLabelState>;
}

/**
 * Adds the product directly when it has exactly one SKU and no options; otherwise links to its page to choose.
 * Samples add to the sample cart.
 */
export function ProductCardAction({ className, children }: ProductCardActionProps): ReactElement {
  const card = useProductCardInternal('ProductCardAction');
  return (
    <div {...partProps('product-card-action', className)}>
      {card.source === 'live' ? (
        <LiveAction product={card.product} name={card.name} href={card.href} label={children} />
      ) : (
        <SampleAction sample={card.sample} label={children} />
      )}
    </div>
  );
}

function LiveAction({
  product,
  name,
  href,
  label,
}: {
  product: SKUGroup;
  name: string;
  href: string;
  label: ProductCardActionProps['children'];
}): ReactElement {
  const selectedSku: SKU | null = getSingleMatchedSku(product);
  const hasVariants: boolean = getProductAttributes(product).length > 0;
  if (!hasVariants && selectedSku)
    return (
      <AddToCart sku={selectedSku} name={name} className={secondaryButtonClass} block>
        {/* Nothing from the host falls back to the button's own label. */}
        {(state: AddToCartLabelState) => renderLabel(label, { action: 'add', ...state }, null)}
      </AddToCart>
    );
  const action = hasVariants ? 'choose-options' : 'view-product';
  return (
    <Link className={`${secondaryButtonClass} w-full`} to={href}>
      {renderLabel(
        label,
        { action, busy: false, soldOut: false },
        hasVariants ? 'Choose options' : 'View product',
      )}
    </Link>
  );
}

function SampleAction({
  sample,
  label,
}: {
  sample: SampleProduct;
  label: ProductCardActionProps['children'];
}): ReactElement {
  const { add } = useSampleCart();
  const custom: ReactNode = renderLabel(label, { action: 'add', busy: false, soldOut: false }, null);
  // A host label stays the start of the accessible name, so it is not replaced by an `aria-label`.
  return custom === null ? (
    <button
      type='button'
      className={`${secondaryButtonClass} w-full`}
      aria-label={`Add ${sample.name} to sample cart`}
      onClick={() => add(sample.key)}
    >
      Add to cart
    </button>
  ) : (
    <button type='button' className={`${secondaryButtonClass} w-full`} onClick={() => add(sample.key)}>
      {custom}
      <span className='sr-only'> ({sample.name}, sample)</span>
    </button>
  );
}

// In the catalog grid each card stretches to its row, and `mt-auto` lines up the actions. No border or fill: the
// card sits directly on the host's background.
export const packagedCardClass: string = 'flex min-w-0 flex-col';

/**
 * The packaged card's parts, inside a root that has `packagedCardClass`. No description: cards scan better without
 * it, and `ProductCardDescription` adds it back.
 */
export function PackagedCardParts(): ReactElement {
  return (
    <>
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
    </>
  );
}

export interface ProductCardProps {
  product: SKUGroup;
}

/** The packaged card for one `SKUGroup`. Compose `ProductCardRoot` and the card parts for a custom card. */
export function ProductCard({ product }: ProductCardProps): ReactElement {
  return (
    <ProductCardRoot product={product} className={packagedCardClass}>
      <PackagedCardParts />
    </ProductCardRoot>
  );
}
