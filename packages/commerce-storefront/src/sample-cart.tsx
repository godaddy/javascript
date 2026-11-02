import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CommerceEvent } from './commerce-provider';
import {
  formatMessage,
  type MessageValues,
  type StorefrontMessageKey,
  type StorefrontMessages,
} from './messages';

/**
 * A product to show while no store is connected. Deliberately distinct from SKU groups, SKUs and draft orders: it
 * is never sent to Commerce. Add any fields of your own, such as a category, and read them back from `sample` in
 * `useProductCard()` and `useCartItem()`.
 */
export interface SampleProduct {
  /** Unique among the samples. */
  readonly key: string;
  readonly name: string;
  /** In minor units of `sampleCurrency`, such as 3200 for $32.00. */
  readonly price: number;
  /** A higher earlier price, in minor units. The card then shows the sale badge and the struck-through price. */
  readonly compareAtPrice?: number;
  readonly description?: string;
  /** Any URL the browser can load, such as a file in the site's own public folder. */
  readonly imageUrl?: string;
}

const builtInNumbers = new Map<SampleProduct, number>();

/** The six packaged samples, "Product 1" to "Product 6", without images. */
export const builtInSamples: readonly SampleProduct[] = Array.from({ length: 6 }, (_, index) => {
  const sample: SampleProduct = {
    key: `sample-${index + 1}`,
    name: `Product ${index + 1}`,
    price: (index + 1) * 1_000,
  };
  builtInNumbers.set(sample, index + 1);
  return sample;
});

export const isBuiltInSample = (sample: SampleProduct): boolean => builtInNumbers.has(sample);

/** Sample prices are examples, in this currency whatever the store's. */
export const sampleCurrency: string = 'USD';

/** A sample's name. Packaged samples are named in the provider's language, such as "Product 1". */
export const sampleName = (
  text: (key: StorefrontMessageKey, values?: MessageValues) => string,
  sample: SampleProduct,
): string => {
  const number: number | undefined = builtInNumbers.get(sample);
  return number === undefined ? sample.name : text('sampleProductName', { number });
};

const validPrice = (price: unknown): boolean => Number.isSafeInteger(price) && (price as number) >= 0;

/** Throws when host samples could not be shown or added consistently. */
export function validateSamples(samples: readonly SampleProduct[]): void {
  if (!samples.length) throw new Error('CatalogRoot sampleProducts needs at least one product, or `true`.');
  const keys = new Set<string>();
  for (const sample of samples) {
    if (typeof sample.key !== 'string' || !sample.key || keys.has(sample.key))
      throw new Error(
        `CatalogRoot sampleProducts need unique, non-empty string keys, not "${String(sample.key)}".`,
      );
    keys.add(sample.key);
    if (typeof sample.name !== 'string' || !sample.name.trim())
      throw new Error(`CatalogRoot sampleProducts: "${sample.key}" needs a non-empty name.`);
    for (const field of ['price', 'compareAtPrice'] as const) {
      const value: unknown = sample[field];
      if ((field === 'price' || value !== undefined) && !validPrice(value))
        throw new Error(
          `CatalogRoot sampleProducts: "${sample.key}" has an invalid ${field}, ${String(value)}. ` +
            'A price must be a whole number of minor units, 0 or more.',
        );
    }
  }
}

interface SampleLine {
  sample: SampleProduct;
  quantity: number;
}

interface SampleCartValue {
  items: { key: string; name: string; price: number; quantity: number; sample: SampleProduct }[];
  add: (sample: SampleProduct) => boolean;
  changeQuantity: (key: string, quantity: number) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
}

const noLines: readonly SampleLine[] = [];

const SampleCartContext = createContext<SampleCartValue | null>(null);

export function useSampleCart(): SampleCartValue {
  const value = useContext(SampleCartContext);
  if (!value) throw new Error('Mount CommerceProvider around sample products.');
  return value;
}

export function SampleCartProvider({
  enabled,
  messages,
  onAdd,
  announce,
  emit,
  children,
}: {
  enabled: boolean;
  messages: StorefrontMessages;
  onAdd: (name: string) => void;
  announce: (key: StorefrontMessageKey) => void;
  emit: (event: CommerceEvent) => void;
  children: ReactNode;
}): ReactElement {
  const text = useCallback(
    (key: StorefrontMessageKey, values?: MessageValues): string => formatMessage(messages, key, values),
    [messages],
  );
  const session = useMemo(() => ({ enabled }), [enabled]);
  const active = useRef<typeof session | null>(session);
  active.current = session;
  // Each line keeps the sample as it was added, so the cart shows it even after the catalog's samples change.
  const [state, setState] = useState({ session, lines: noLines });
  useEffect(() => {
    active.current = session;
    setState({ session, lines: noLines });
    return () => {
      active.current = null;
    };
  }, [session]);
  const lines = state.session === session && enabled ? state.lines : noLines;
  // Stable while the lines are, so `useCart` and the cart parts don't recompute on every render.
  const items = useMemo(
    () =>
      lines.map(({ sample, quantity }) => ({
        key: sample.key,
        name: sampleName(text, sample),
        price: sample.price,
        quantity,
        sample,
      })),
    [lines, text],
  );
  // Adds a line for a new sample, so only quantity changes need the key to be in the cart already.
  function update(key: string, quantity?: number, added?: SampleProduct): boolean {
    if (!enabled || active.current !== session) return false;
    if (!added && !lines.some((line) => line.sample.key === key)) return false;
    if (quantity !== undefined && (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 999))
      return false;
    setState((previous) => {
      const current: readonly SampleLine[] = previous.session === session ? previous.lines : noLines;
      const line: SampleLine | undefined = current.find((candidate) => candidate.sample.key === key);
      const next: number = quantity ?? (line?.quantity ?? 0) + 1;
      if (next > 999) return previous;
      const kept: SampleLine[] = current.filter((candidate) => candidate !== line);
      if (next === 0) return { session, lines: kept };
      if (!line && added) return { session, lines: [...current, { sample: added, quantity: next }] };
      return {
        session,
        lines: current.map((candidate) =>
          candidate === line ? { ...candidate, quantity: next } : candidate,
        ),
      };
    });
    return true;
  }
  return (
    <SampleCartContext.Provider
      value={{
        items,
        add: (sample) => {
          if (!update(sample.key, undefined, sample)) return false;
          onAdd(sampleName(text, sample));
          return true;
        },
        changeQuantity: async (key, quantity) => {
          const updated = quantity >= 1 && update(key, quantity);
          if (updated) {
            announce('sampleQuantityUpdated');
            emit({ type: 'quantity-changed', itemId: key, quantity, isSample: true });
          }
          return updated;
        },
        remove: async (key) => {
          const updated = update(key, 0);
          if (updated) {
            announce('sampleItemRemoved');
            emit({ type: 'item-removed', itemId: key, isSample: true });
          }
          return updated;
        },
      }}
    >
      {children}
    </SampleCartContext.Provider>
  );
}
