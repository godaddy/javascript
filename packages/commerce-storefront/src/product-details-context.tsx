import { useQuery } from '@tanstack/react-query';
import {
  createContext,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link, useParams } from 'react-router';
import { ApiError, message, request } from './api';
import { isSoldOut } from './cart';
import {
  getAvailableInventoryQuantity,
  getImageUrls,
  getLabeledSkuOptions,
  getProductAttributes,
  getProductName,
  getSingleMatchedSku,
  getSkuAttributeValueNames,
  type SKU,
  type SKUGroup,
  type SKUPrice,
  type SkuGroupResult,
  type StorefrontProductAttribute,
} from './catalog-model';
import { buttonClass, errorNoticeClass } from './class-names';
import { type GetSwatch, useCommerce } from './commerce-provider';
import { hasChildren, type PartLabel, partProps, renderLabel, usePartRegistry } from './part';
import { useRootParams } from './root-params';
import { CommerceStatus, StorefrontSurface } from './storefront-surface';

/** Where the shopper is in choosing a purchasable SKU. Only `ready` has a verified `selectedSku`. */
export type ProductDetailsStatus =
  | 'incomplete'
  | 'checking'
  | 'variant-error'
  | 'unavailable'
  | 'not-purchasable'
  | 'ready';

/** Read-only product state for custom parts rendered inside `ProductDetailsRoot`. */
export interface ProductDetailsState {
  readonly product: SKUGroup;
  readonly name: string;
  /** Set only after the server verifies the full selection. */
  readonly selectedSku: SKU | null;
  readonly quantity: number;
  /** `null` means inventory is not tracked; `0` means sold out. */
  readonly availableQuantity: number | null;
  readonly status: ProductDetailsStatus;
  readonly images: readonly string[];
}

interface ProductDetailsInternal extends ProductDetailsState {
  attributes: StorefrontProductAttribute[];
  selections: string[];
  skuOptions: SKU[];
  explicitSkuId: string;
  price: SKUPrice | null | undefined;
  imageIndex: number;
  variantError: unknown;
  setImageIndex: (index: number) => void;
  setQuantity: (quantity: number) => void;
  selectOption: (attribute: string, value: string) => void;
  selectSku: (skuId: string) => void;
  retryVariant: () => void;
  register: (control: string) => () => void;
  /** Value names that are sold out, by attribute index, given the other attributes' selections. */
  soldOutValues: ReadonlySet<string>[];
  /** The shopper pressed add before choosing every option, so missing options show an error. */
  showMissing: boolean;
  /** Shows the missing-option errors and focuses the first missing control. */
  requestMissing: () => void;
  getSwatch: GetSwatch | undefined;
}

/** Props shared by every product part. `className` is added to the part's outer element. */
export interface ProductDetailsPartProps {
  className?: string;
}

const ProductDetailsContext = createContext<ProductDetailsInternal | null>(null);

export function useProductDetailsInternal(part: string): ProductDetailsInternal {
  const context = useContext(ProductDetailsContext);
  if (!context) throw new Error(`${part} must be rendered inside <ProductDetailsRoot>.`);
  return context;
}

/** Read the current product, verified SKU, and purchase status from inside `ProductDetailsRoot`. */
export function useProductDetails(): ProductDetailsState {
  const { product, name, selectedSku, quantity, availableQuantity, status, images } =
    useProductDetailsInternal('useProductDetails');
  return { product, name, selectedSku, quantity, availableQuantity, status, images };
}

export interface ProductDetailsOptionValueState {
  readonly name: string;
  readonly label: string;
  readonly selected: boolean;
  /**
   * Every SKU with this value and the other selected values has tracked stock used up. `false` when that is not
   * known, such as for a product with more SKUs than the page loads.
   */
  readonly soldOut: boolean;
  /** The CSS background from the provider's `getSwatch`, or `null`. */
  readonly swatch: string | null;
}

export interface ProductDetailsOptionState {
  readonly name: string;
  readonly label: string;
  readonly selected: string | null;
  /** Nothing is selected and the shopper pressed add, so the control should show an error. */
  readonly missing: boolean;
  readonly values: readonly ProductDetailsOptionValueState[];
  /** Accepts only this attribute's own value names, or `null` to clear. Other values are ignored. */
  readonly select: (value: string | null) => void;
}

/**
 * Build a custom control for one product attribute. Returns `null` when the product has no such attribute.
 * A selection is never purchasable until the server verifies it.
 */
export function useProductDetailsOption(attribute: string): ProductDetailsOptionState | null {
  const { attributes, selections, selectOption, register, soldOutValues, showMissing, getSwatch } =
    useProductDetailsInternal('useProductDetailsOption');
  useEffect(() => register(`attribute:${attribute}`), [attribute, register]);
  const index: number = attributes.findIndex((candidate) => candidate.name === attribute);
  const match: StorefrontProductAttribute | undefined = attributes[index];
  if (!match) return null;
  const selected: string | null = selections[index] || null;
  return {
    name: match.name,
    label: match.label,
    selected,
    missing: showMissing && !selected,
    values: match.values.map((value) => ({
      name: value.name,
      label: value.label,
      selected: value.name === selected,
      soldOut: soldOutValues[index]?.has(value.name) ?? false,
      swatch: getSwatch?.({ attribute: match.name, name: value.name, label: value.label }) || null,
    })),
    select: (value: string | null): void => {
      if (value === null) selectOption(attribute, '');
      else if (match.values.some((candidate) => candidate.name === value)) selectOption(attribute, value);
    },
  };
}

/** Register the explicit SKU control so the layout check knows SKU-list products can be completed. */
export function useSkuOptionRegistration(): void {
  const { register } = useProductDetailsInternal('ProductDetailsOptions');
  useEffect(() => register('sku'), [register]);
}

export interface ProductDetailsRootProps {
  children: ReactNode;
  /** Added to the root `<article>`. */
  className?: string;
  /** The product to show. Defaults to the route's `:productId` parameter. */
  productId?: string;
  /**
   * Keep the selected options and SKU in the page URL, as `option.<attribute>` and `sku`, so a reload or a shared link
   * keeps them. Defaults to `true`. Set `false` for every other root on the same page, such as a quick view, so the
   * roots do not share one selection.
   */
  urlState?: boolean;
  /** Replaces the loading message. */
  loading?: ReactNode;
  /** Replaces the not-found heading and link. */
  notFound?: ReactNode;
  /** Replaces the load failure. A function receives the failure message and a `retry` for the product request. */
  error?: PartLabel<ProductDetailsErrorState>;
}

/** What a replacement for the product load failure receives. */
export interface ProductDetailsErrorState {
  readonly message: string;
  readonly retry: () => void;
}

/** Loads one product, by default the route's `:productId`, and provides state to product parts. */
export function ProductDetailsRoot({
  productId: productIdProp,
  className,
  ...props
}: ProductDetailsRootProps): ReactElement {
  const { productId: routeProductId = '' } = useParams();
  const productId: string = productIdProp ?? routeProductId;
  const { connection } = useCommerce();
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || productId || connection !== 'ready') return;
    console.warn(
      '[gd-commerce-storefront] ProductDetailsRoot has no product to show. Pass `productId`, or render it on a ' +
        'route with a `:productId` parameter.',
    );
  }, [productId, connection]);
  return (
    <StorefrontSurface>
      {connection === 'ready' ? (
        <ProductDetailsLoader key={productId} productId={productId} className={className} {...props} />
      ) : (
        // Host classes stay on while connecting, so the layout does not jump when the product replaces the status.
        <div {...partProps('product-details-root', className)}>
          <CommerceStatus />
        </div>
      )}
    </StorefrontSurface>
  );
}

function ProductDetailsLoader({
  productId,
  className,
  children,
  urlState = true,
  loading,
  notFound,
  error,
}: ProductDetailsRootProps & { productId: string }): ReactElement {
  const { config, getSwatch } = useCommerce();
  const [params, setParams] = useRootParams(urlState);
  const [quantity, setQuantity] = useState<number>(1);
  const [imageIndex, setImageIndex] = useState<number>(0);
  const [showMissing, setShowMissing] = useState<boolean>(false);
  const [focusMissing, setFocusMissing] = useState<number>(0);
  const root = useRef<HTMLElement>(null);
  // After the errors render, so the first missing control is marked.
  useEffect(() => {
    if (focusMissing) focusFirstMissing(root);
  }, [focusMissing]);
  const product = useQuery({
    retry: false,
    enabled: !!productId,
    queryKey: ['commerce', config.cartScope, 'product', productId],
    queryFn: ({ signal }) =>
      request<SkuGroupResult>(`/products/${encodeURIComponent(productId)}`, {
        signal,
        headers: { 'X-Commerce-Scope': config.cartScope },
      }),
  });
  const productNotFound: boolean =
    product.isError && product.error instanceof ApiError && product.error.status === 404;
  const group = product.data?.skuGroup;
  const attributes = getProductAttributes(group);
  const skuOptions: SKU[] = getLabeledSkuOptions(group);
  const explicitSku: SKU | undefined = skuOptions.find((sku: SKU): boolean => sku.id === params.get('sku'));
  const selections: string[] = attributes.map((attribute) => params.get(`option.${attribute.name}`) ?? '');
  const complete: boolean =
    skuOptions.length > 0
      ? !!explicitSku
      : attributes.every((attribute, index) =>
          attribute.values.some((value) => value.name === selections[index]),
        );
  const selectionParams: URLSearchParams = new URLSearchParams();
  selections.filter(Boolean).forEach((value) => {
    selectionParams.append('attributeValues', value);
  });
  const matched = useQuery({
    retry: false,
    queryKey: ['commerce', config.cartScope, 'product-variants', productId, selections],
    queryFn: ({ signal }) =>
      request<SkuGroupResult>(`/products/${encodeURIComponent(productId)}?${selectionParams}`, {
        signal,
        headers: { 'X-Commerce-Scope': config.cartScope },
      }),
    enabled: !!group && attributes.length > 0 && complete,
  });
  const selectionVerified: boolean =
    complete &&
    product.isSuccess &&
    !product.isFetching &&
    (attributes.length === 0 || (matched.isSuccess && !matched.isFetching));
  const selectedSku: SKU | null = selectionVerified
    ? (explicitSku ?? getSingleMatchedSku(attributes.length ? matched.data?.skuGroup : group))
    : null;
  const status: ProductDetailsStatus = !complete
    ? 'incomplete'
    : matched.isError && !matched.isFetching
      ? 'variant-error'
      : !selectionVerified
        ? 'checking'
        : selectedSku
          ? 'ready'
          : attributes.length
            ? 'unavailable'
            : 'not-purchasable';
  const selectedImages: string[] = getImageUrls(selectedSku);
  const images: string[] = [...new Set(selectedImages.length ? selectedImages : getImageUrls(group))];
  const changeSelection = (key: string, value: string): void => {
    const next: URLSearchParams = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setQuantity(1);
    setImageIndex(0);
  };
  const { register, has } = usePartRegistry();
  const requiredControls: string = [
    ...attributes.map((attribute) => `attribute:${attribute.name}`),
    ...(skuOptions.length ? ['sku'] : []),
  ].join('\n');
  // Parent effects run after child effects, so every mounted control has registered by now. Controls can mount
  // later (accordions, tabs, sheets), so the warning describes the current render only. Development builds only,
  // like the peer query library's own checks.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const missing: string[] = requiredControls.split('\n').filter((control) => control && !has(control));
    if (missing.length === 0) return;
    console.warn(
      `[gd-commerce-storefront] No control for ${missing
        .map((control) => (control === 'sku' ? 'the SKU option' : `"${control.slice('attribute:'.length)}"`))
        .join(', ')} is rendered right now, so this product cannot be added to the cart until one is. ` +
        `Render <ProductDetailsOptions />, <ProductDetailsOption attribute='…' /> for each attribute, ` +
        `or <ProductDetailsPurchase />, or ignore this if the control mounts later.`,
    );
  }, [requiredControls, has]);
  // Without a product ID there is nothing to load; the disabled query would stay pending forever.
  if (product.isPending && productId)
    return (
      <div {...partProps('product-details-root', className)}>
        {hasChildren(loading) ? (
          loading
        ) : (
          <p role='status' className='text-sm text-commerce-muted'>
            Loading product…
          </p>
        )}
      </div>
    );
  if (product.isError && !productNotFound) {
    const retry = (): void => void product.refetch();
    return (
      <div role='alert' {...partProps('product-details-root', className)}>
        {renderLabel(
          error,
          { message: message(product.error), retry },
          <>
            <h1 className='text-2xl font-semibold tracking-tight'>Product unavailable</h1>
            <p className={`my-4 ${errorNoticeClass}`}>{message(product.error)}</p>
            <button type='button' className={buttonClass} onClick={retry}>
              Retry product
            </button>
          </>,
        )}
      </div>
    );
  }
  if (productNotFound || !group)
    return (
      <div {...partProps('product-details-root', className)}>
        {hasChildren(notFound) ? (
          notFound
        ) : (
          <>
            <h1 className='text-2xl font-semibold tracking-tight'>Product not found</h1>
            <Link className={`${buttonClass} mt-6`} to={config.catalogPath}>
              Back to shop
            </Link>
          </>
        )}
      </div>
    );
  const value: ProductDetailsInternal = {
    product: group,
    name: getProductName(group),
    selectedSku,
    quantity,
    availableQuantity: getAvailableInventoryQuantity(selectedSku),
    status,
    images,
    attributes,
    selections,
    skuOptions,
    explicitSkuId: explicitSku?.id ?? '',
    price: selectedSku?.prices?.edges?.find((edge) => edge?.node?.value)?.node,
    imageIndex: Math.min(imageIndex, Math.max(images.length - 1, 0)),
    variantError: matched.error,
    setImageIndex: (index: number): void => {
      if (Number.isInteger(index) && index >= 0 && index < images.length) setImageIndex(index);
    },
    setQuantity,
    selectOption: (attribute: string, next: string): void => changeSelection(`option.${attribute}`, next),
    selectSku: (skuId: string): void =>
      changeSelection('sku', skuOptions.some((sku) => sku.id === skuId) ? skuId : ''),
    retryVariant: (): void => {
      if (matched.isError) void matched.refetch();
    },
    register,
    soldOutValues: getSoldOutValues(group, attributes, selections),
    showMissing,
    requestMissing: (): void => {
      setShowMissing(true);
      setFocusMissing((count) => count + 1);
    },
    getSwatch,
  };
  return (
    <ProductDetailsContext.Provider value={value}>
      <article ref={root} {...partProps('product-details-root', className)}>
        {children}
      </article>
    </ProductDetailsContext.Provider>
  );
}

// Controls for a missing option carry `data-commerce-missing`. A sticky bar may repeat the controls; the first wins.
function focusFirstMissing(root: RefObject<HTMLElement | null>): void {
  root.current
    ?.querySelector<HTMLElement>(
      '[data-commerce-missing] input:not(:disabled), [data-commerce-missing] select',
    )
    ?.focus();
}

/**
 * For each attribute, the values whose every SKU, among those with the other selected values, has tracked stock
 * used up. Needs every SKU with its attribute values, so it is empty for a truncated list or an older server.
 */
function getSoldOutValues(
  group: SKUGroup | null | undefined,
  attributes: StorefrontProductAttribute[],
  selections: string[],
): ReadonlySet<string>[] {
  const connection = group?.skus;
  const skus: SKU[] = connection?.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];
  const values: (string[] | null)[] = skus.map(getSkuAttributeValueNames);
  const complete: boolean =
    !connection?.pageInfo?.hasNextPage &&
    (connection?.totalCount ?? skus.length) === skus.length &&
    values.every((names) => names !== null);
  return attributes.map((attribute, index) => {
    const soldOut: Set<string> = new Set();
    if (!complete) return soldOut;
    const others: string[] = selections.filter((selection, other) => other !== index && selection);
    for (const value of attribute.values) {
      const matching: SKU[] = skus.filter((_, sku) => {
        const names: string[] = values[sku] ?? [];
        return names.includes(value.name) && others.every((selection) => names.includes(selection));
      });
      if (matching.length && matching.every((sku) => isSoldOut(getAvailableInventoryQuantity(sku))))
        soldOut.add(value.name);
    }
    return soldOut;
  });
}
