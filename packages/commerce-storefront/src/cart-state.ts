import { useMemo } from 'react';
import { useCommerce } from './commerce-provider';
import { type SampleProduct, sampleCurrency, useSampleCart } from './sample-cart';

/** One cart line, for custom cart parts. */
export interface CartItemState<Sample extends SampleProduct = SampleProduct> {
  /** Empty when the server returned a line without an ID. Such a line cannot be changed or removed. */
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly imageUrl: string | null;
  readonly options: readonly { readonly attribute: string; readonly values: readonly string[] }[];
  /** The line total in minor units, or `null` when the server did not price it. */
  readonly subtotal: number | null;
  readonly currency: string;
  /** The sample as it was added, with the site's own fields. `null` for a line in the connected store's cart. */
  readonly sample: Sample | null;
}

/** Read-only cart contents: the connected store's cart, or the sample cart while no store is connected. */
export interface CartState {
  readonly items: readonly CartItemState[];
  readonly itemCount: number;
  /** The cart subtotal in minor units, or `null` when the server did not price it. */
  readonly subtotal: number | null;
  readonly currency: string;
  readonly isSample: boolean;
  /** `true` while the saved cart loads. */
  readonly loading: boolean;
}

/** Read the cart from anywhere inside `CommerceProvider`, for example to build a custom cart button. */
export function useCart(): CartState {
  const { cart, config, connection, hydrating } = useCommerce();
  const sample = useSampleCart();
  const isSample: boolean = connection === 'unbound';
  const sampleItems = sample.items;
  return useMemo((): CartState => {
    // Shared presentation only: sample entries never become draft orders or live mutation inputs.
    if (isSample)
      return {
        items: sampleItems.map((item) => ({
          id: item.key,
          name: item.name,
          quantity: item.quantity,
          imageUrl: item.sample.imageUrl || null,
          options: [],
          subtotal: item.price * item.quantity,
          currency: sampleCurrency,
          sample: item.sample,
        })),
        itemCount: sampleItems.reduce((total, item) => total + item.quantity, 0),
        subtotal: sampleItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        currency: sampleCurrency,
        isSample,
        loading: false,
      };
    const currency: string = cart?.totals?.total?.currencyCode ?? config.currencyCode;
    const lines = cart?.lineItems ?? [];
    const subtotal = cart?.totals?.subTotal?.value;
    return {
      items: lines.map((item) => ({
        id: item.id ?? '',
        name: item.name ?? '',
        quantity: item.quantity ?? 0,
        imageUrl: item.details?.productAssetUrl || null,
        options: [
          ...(item.details?.selectedOptions ?? []).map((option) => ({
            attribute: option.attribute ?? '',
            values: option.values ?? [],
          })),
          ...(item.details?.selectedAddons ?? []).map((addon) => ({
            attribute: addon.attribute ?? '',
            values: (addon.values ?? []).map((value) => value.name ?? ''),
          })),
        ],
        subtotal: typeof item.totals?.subTotal?.value === 'number' ? item.totals.subTotal.value : null,
        currency: item.totals?.subTotal?.currencyCode ?? currency,
        sample: null,
      })),
      itemCount: lines.reduce((total, item) => total + (item.quantity ?? 0), 0),
      subtotal: typeof subtotal === 'number' ? subtotal : null,
      currency: cart?.totals?.subTotal?.currencyCode ?? currency,
      isSample,
      loading: hydrating,
    };
  }, [cart, config.currencyCode, hydrating, isSample, sampleItems]);
}
