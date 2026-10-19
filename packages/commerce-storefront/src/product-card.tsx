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
import { AddToCartButton, type AddToCartLabelState, buttonClass } from './cart';
import {
  getPrimaryImageUrl,
  getProductAttributes,
  getProductName,
  getSingleMatchedSku,
  type SKU,
  type SKUGroup,
} from './catalog-model';
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
  const [failed, setFailed] = useState<boolean>(false);
  return url && !failed ? (
    <img
      src={url}
      alt={name}
      loading='lazy'
      className={`h-full w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={`flex h-full min-h-44 items-center justify-center p-6 text-center ${className}`}
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
          className='block aspect-square overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4'
        >
          <ProductImage
            url={getPrimaryImageUrl(card.product)}
            name={card.name}
            className='motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105'
          />
        </Link>
      ) : (
        <div aria-hidden='true' className='flex aspect-square items-center justify-center bg-neutral-100'>
          <div className='h-20 w-20 rounded-lg border border-neutral-300' />
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
      <h2 className='break-words text-2xl font-semibold leading-tight'>
        {href ? (
          <Link
            className='rounded text-inherit hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
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
      <p className='line-clamp-3 text-sm leading-6'>{product.description}</p>
    </div>
  );
}

/** The product's price, or its price range when variants differ. */
export function ProductCardPrice({ className }: ProductCardPartProps): ReactElement {
  const card = useProductCardInternal('ProductCardPrice');
  const money = useMoney();
  let text: string;
  if (card.source === 'sample') text = money(card.sample.price, 'USD');
  else {
    const min: number | null | undefined = card.product.priceRange?.min;
    const max: number | null | undefined = card.product.priceRange?.max;
    text =
      typeof min === 'number'
        ? `${money(min)}${typeof max === 'number' && max !== min ? ` – ${money(max)}` : ''}`
        : 'Price unavailable';
  }
  return (
    <div {...partProps('product-card-price', className)}>
      <p className='text-lg font-semibold leading-7'>{text}</p>
    </div>
  );
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
      <AddToCartButton sku={selectedSku} name={name}>
        {/* Nothing from the host falls back to the button's own label. */}
        {(state: AddToCartLabelState) => renderLabel(label, { action: 'add', ...state }, null)}
      </AddToCartButton>
    );
  const action = hasVariants ? 'choose-options' : 'view-product';
  return (
    <Link className={buttonClass} to={href}>
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
  return (
    <button
      type='button'
      className={buttonClass}
      aria-label={`Add ${sample.name} to sample cart`}
      onClick={() => add(sample.key)}
    >
      {renderLabel(label, { action: 'add', busy: false, soldOut: false }, 'Add to cart')}
    </button>
  );
}

// In the catalog grid each card stretches to its row, and `mt-auto` lines up the price rows.
export const packagedCardClass: string =
  'flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-200';

/** The packaged card's parts, inside a root that has `packagedCardClass`. */
export function PackagedCardParts(): ReactElement {
  return (
    <>
      <ProductCardImage />
      <div className='flex flex-1 flex-col p-6'>
        <ProductCardTitle />
        <ProductCardDescription className='mt-3' />
        <div className='mt-auto pt-6'>
          <div className='flex flex-wrap items-end justify-between gap-4 border-t border-neutral-200 pt-5'>
            <ProductCardPrice className='min-w-0 flex-1' />
            <ProductCardAction className='max-w-full' />
          </div>
        </div>
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
