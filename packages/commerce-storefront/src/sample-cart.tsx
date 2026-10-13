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

// Deliberately distinct from SKU groups, SKUs and draft orders. Never sent to Commerce.
export const sampleProducts = Array.from({ length: 6 }, (_, index) => ({
  key: `sample-${index + 1}`,
  name: `Product ${index + 1}`,
  price: (index + 1) * 1_000,
}));

interface SampleCartValue {
  items: { key: string; name: string; price: number; quantity: number }[];
  add: (key: string) => boolean;
  changeQuantity: (key: string, quantity: number) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
}

const SampleCartContext = createContext<SampleCartValue | null>(null);

export function useSampleCart(): SampleCartValue {
  const value = useContext(SampleCartContext);
  if (!value) throw new Error('Mount CommerceProvider around sample products.');
  return value;
}

export function SampleCartProvider({
  enabled,
  onAdd,
  announce,
  children,
}: {
  enabled: boolean;
  onAdd: (name: string) => void;
  announce: (message: string) => void;
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
  const quantities = state.session === session && enabled ? state.quantities : {};
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
        items: sampleProducts.flatMap((product) =>
          quantities[product.key] ? [{ ...product, quantity: quantities[product.key] }] : [],
        ),
        add: (key) => {
          const product = sampleProducts.find((product) => product.key === key);
          if (!product || !update(key)) return false;
          onAdd(product.name);
          return true;
        },
        changeQuantity: async (key, quantity) => {
          const updated = quantity >= 1 && update(key, quantity);
          if (updated) announce('Sample cart quantity updated.');
          return updated;
        },
        remove: async (key) => {
          const updated = update(key, 0);
          if (updated) announce('Sample item removed from cart.');
          return updated;
        },
      }}
    >
      {children}
    </SampleCartContext.Provider>
  );
}
