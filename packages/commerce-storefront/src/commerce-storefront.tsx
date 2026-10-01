import { CartDrawer } from './cart';
import { CommerceProvider, type CommerceProviderProps } from './commerce-provider';

/** Mount once inside the application's Router and QueryClientProvider. */
export function CommerceStorefront({ children, ...props }: CommerceProviderProps) {
  return (
    <CommerceProvider {...props}>
      {children}
      <CartDrawer />
    </CommerceProvider>
  );
}
