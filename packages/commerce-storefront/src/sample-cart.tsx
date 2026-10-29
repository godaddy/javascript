import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CommerceEvent } from './commerce-provider';
import { formatMessage, type StorefrontMessageKey, type StorefrontMessages } from './messages';

// Deliberately distinct from SKU groups, SKUs and draft orders. Never sent to Commerce.
export const sampleProducts = Array.from({ length: 6 }, (_, index) => ({
  key: `sample-${index + 1}`,
  number: index + 1,
  price: (index + 1) * 1_000,
}));
export type SampleProduct = (typeof sampleProducts)[number];

/** Sample prices are examples, in this currency whatever the store's. */
export const sampleCurrency: string = 'USD';

export const sampleName = (messages: StorefrontMessages, sample: SampleProduct): string =>
  formatMessage(messages, 'sampleProductName', { number: sample.number });

interface SampleCartValue {
  items: { key: string; name: string; price: number; quantity: number }[];
  add: (key: string) => boolean;
  changeQuantity: (key: string, quantity: number) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
}

const noQuantities: Record<string, number> = {};

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
  const session = useMemo(() => ({ enabled }), [enabled]);
  const active = useRef<typeof session | null>(session);
  active.current = session;
  const [state, setState] = useState({ session, quantities: {} as Record<string, number> });
  useEffect(() => {
    active.current = session;
    setState({ session, quantities: {} });
    return () => {
      active.current = null;
    };
  }, [session]);
  const quantities = state.session === session && enabled ? state.quantities : noQuantities;
  // Stable while the quantities are, so `useCart` and the cart parts don't recompute on every render.
  const items = useMemo(
    () =>
      sampleProducts.flatMap((product) =>
        quantities[product.key]
          ? [{ ...product, name: sampleName(messages, product), quantity: quantities[product.key] }]
          : [],
      ),
    [quantities, messages],
  );
  function update(key: string, quantity?: number): boolean {
    if (!enabled || active.current !== session || !sampleProducts.some((product) => product.key === key))
      return false;
    if (quantity !== undefined && (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 999))
      return false;
    setState((previous) => {
      const current = previous.session === session ? previous.quantities : {};
      const next = quantity ?? (current[key] ?? 0) + 1;
      if (next > 999) return previous;
      return { session, quantities: { ...current, [key]: next } };
    });
    return true;
  }
  return (
    <SampleCartContext.Provider
      value={{
        items,
        add: (key) => {
          const product = sampleProducts.find((product) => product.key === key);
          if (!product || !update(key)) return false;
          onAdd(sampleName(messages, product));
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
