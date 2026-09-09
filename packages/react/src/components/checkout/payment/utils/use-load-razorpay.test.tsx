import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLoadRazorpay } from './use-load-razorpay';

vi.mock('@/components/checkout/checkout', () => ({
  useCheckoutContext: () => ({
    razorpayConfig: { publicToken: 'rzp_test_public' },
  }),
}));

describe('useLoadRazorpay', () => {
  afterEach(() => {
    document.getElementById('razorpay-sdk')?.remove();
    Reflect.deleteProperty(window, 'Razorpay');
  });

  it('loads the Razorpay Checkout SDK once', async () => {
    const { result } = renderHook(() => useLoadRazorpay());
    const script = document.getElementById(
      'razorpay-sdk'
    ) as HTMLScriptElement | null;

    expect(script?.src).toBe(
      'https://checkout.razorpay.com/v1/checkout.js'
    );
    expect(result.current.isRazorpayLoaded).toBe(false);

    Object.defineProperty(window, 'Razorpay', {
      configurable: true,
      value: vi.fn(),
    });
    act(() => {
      script?.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(result.current.isRazorpayLoaded).toBe(true);
      expect(result.current.isRazorpayLoadFailed).toBe(false);
    });
  });
});
