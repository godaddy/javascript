import { useQuery } from '@tanstack/react-query';
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ApiError, message, request } from './api';
import { buttonClass } from './cart';
import {
  getAvailableInventoryQuantity,
  getImageUrls,
  getLabeledSkuOptions,
  getProductAttributes,
  getSingleMatchedSku,
  type SKU,
  type SKUGroup,
  type SKUPrice,
  type SkuGroupResult,
  type StorefrontProductAttribute,
} from './catalog-model';
import { useCommerce } from './commerce-provider';
import { CommerceStatus, StorefrontSurface } from './storefront-surface';

/** Where the shopper is in choosing a purchasable SKU. Only `ready` has a verified `selectedSku`. */
export type PurchaseStatus =
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
  readonly status: PurchaseStatus;
  readonly images: readonly string[];
}

interface ProductDetailsInternal extends ProductDetailsState {
  fieldId: string;
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
}

/** Props shared by every product part. `className` is added to the part's outer element. */
export interface ProductPartProps {
  className?: string;
}

export const cx = (...classes: Array<string | undefined>): string => classes.filter(Boolean).join(' ');

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

export interface ProductOptionValueState {
  readonly name: string;
  readonly label: string;
  readonly selected: boolean;
}

export interface ProductOptionState {
  readonly name: string;
  readonly label: string;
  readonly selected: string | null;
  readonly values: readonly ProductOptionValueState[];
  /** Accepts only this attribute's own value names, or `null` to clear. Other values are ignored. */
  readonly select: (value: string | null) => void;
}

/**
 * Build a custom control for one product attribute. Returns `null` when the product has no such attribute.
 * A selection is never purchasable until the server verifies it.
 */
export function useProductOption(attribute: string): ProductOptionState | null {
  const { attributes, selections, selectOption, register } = useProductDetailsInternal('useProductOption');
  useEffect(() => register(`attribute:${attribute}`), [attribute, register]);
  const index: number = attributes.findIndex((candidate) => candidate.name === attribute);
  const match: StorefrontProductAttribute | undefined = attributes[index];
  if (!match) return null;
  const selected: string | null = selections[index] || null;
  return {
    name: match.name,
    label: match.label,
    selected,
    values: match.values.map((value) => ({
      name: value.name,
      label: value.label,
      selected: value.name === selected,
    })),
    select: (value: string | null): void => {
      if (value === null) selectOption(attribute, '');
      else if (match.values.some((candidate) => candidate.name === value)) selectOption(attribute, value);
    },
  };
}

/** Register the explicit SKU control so the layout check knows SKU-list products can be completed. */
export function useSkuOptionRegistration(): void {
  const { register } = useProductDetailsInternal('ProductOptions');
  useEffect(() => register('sku'), [register]);
}

export interface ProductDetailsRootProps {
  children: ReactNode;
  /** Added to the root `<article>`. */
  className?: string;
}

/** Loads the product for the route's `:productId` and provides state to product parts. */
export function ProductDetailsRoot({ children, className }: ProductDetailsRootProps): ReactElement {
  const { productId = '' } = useParams();
  const { connection } = useCommerce();
  return (
    <StorefrontSurface>
      {connection === 'ready' ? (
        <ProductDetailsLoader key={productId} productId={productId} className={className}>
          {children}
        </ProductDetailsLoader>
      ) : (
        <CommerceStatus />
      )}
    </StorefrontSurface>
  );
}

function ProductDetailsLoader({
  productId,
  className,
  children,
}: ProductDetailsRootProps & { productId: string }): ReactElement {
  const { config } = useCommerce();
  const fieldId = useId();
  const [params, setParams] = useSearchParams();
  const [quantity, setQuantity] = useState<number>(1);
  const [imageIndex, setImageIndex] = useState<number>(0);
  const product = useQuery({
    retry: false,
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
  const status: PurchaseStatus = !complete
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
  const registered = useRef<Map<string, number>>(new Map());
  const register = useCallback((control: string): (() => void) => {
    const counts: Map<string, number> = registered.current;
    counts.set(control, (counts.get(control) ?? 0) + 1);
    return () => {
      const count: number = (counts.get(control) ?? 1) - 1;
      if (count > 0) counts.set(control, count);
      else counts.delete(control);
    };
  }, []);
  const requiredControls: string = [
    ...attributes.map((attribute) => `attribute:${attribute.name}`),
    ...(skuOptions.length ? ['sku'] : []),
  ].join('\n');
  // Parent effects run after child effects, so every mounted control has registered by now.
  useEffect(() => {
    const missing: string[] = requiredControls
      .split('\n')
      .filter((control) => control && !registered.current.has(control));
    if (missing.length === 0) return;
    console.warn(
      `[gd-commerce-storefront] This product layout cannot select ${missing
        .map((control) => (control === 'sku' ? 'a SKU option' : `"${control.slice('attribute:'.length)}"`))
        .join(', ')}, so it can never be added to the cart. Render <ProductOptions />, ` +
        `<ProductOption attribute='…' /> for each attribute, or <ProductPurchase />.`,
    );
  }, [requiredControls]);
  if (product.isPending) return <p role='status'>Loading product…</p>;
  if (product.isError && !productNotFound)
    return (
      <div role='alert'>
        <h1 className='text-2xl font-semibold'>Product unavailable</h1>
        <p className='my-4 text-red-700'>{message(product.error)}</p>
        <button type='button' className={buttonClass} onClick={() => void product.refetch()}>
          Retry product
        </button>
      </div>
    );
  if (productNotFound || !group)
    return (
      <div>
        <h1 className='text-2xl font-semibold'>Product not found</h1>
        <Link className={`${buttonClass} mt-4`} to={config.catalogPath}>
          Back to shop
        </Link>
      </div>
    );
  const value: ProductDetailsInternal = {
    product: group,
    name: group.label ?? group.name ?? 'Product',
    selectedSku,
    quantity,
    availableQuantity: getAvailableInventoryQuantity(selectedSku),
    status,
    images,
    fieldId,
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
  };
  return (
    <ProductDetailsContext.Provider value={value}>
      <article className={className}>{children}</article>
    </ProductDetailsContext.Provider>
  );
}
