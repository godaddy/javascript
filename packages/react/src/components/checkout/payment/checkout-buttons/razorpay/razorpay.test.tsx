import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RazorpayCheckoutButton } from './razorpay';

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  confirm: vi.fn(),
  flush: vi.fn(),
  setCheckoutErrors: vi.fn(),
  trigger: vi.fn(),
  setFocus: vi.fn(),
  getValues: vi.fn(),
}));

vi.mock('@/components/checkout/checkout', () => ({
  useCheckoutContext: () => ({
    session: { storeName: 'Test Store' },
    setCheckoutErrors: mocks.setCheckoutErrors,
    isConfirmingCheckout: false,
  }),
}));

vi.mock('@/components/checkout/payment/utils/use-authorize-checkout', () => ({
  useAuthorizeCheckout: () => ({
    mutateAsync: mocks.authorize,
    isPending: false,
  }),
}));

vi.mock('@/components/checkout/payment/utils/use-confirm-checkout', () => ({
  PaymentProvider: { RAZORPAY: 'RAZORPAY' },
  useConfirmCheckout: () => ({ mutateAsync: mocks.confirm }),
}));

vi.mock('@/components/checkout/payment/utils/use-flush-checkout-sync', () => ({
  useFlushCheckoutSync: () => mocks.flush,
}));

vi.mock('@/components/checkout/payment/utils/use-is-payment-disabled', () => ({
  useIsPaymentDisabled: () => false,
}));

vi.mock('@/components/checkout/payment/utils/razorpay-loader-context', () => ({
  RazorpayLoaderProvider: ({ children }: { children: ReactNode }) => children,
  useRazorpayLoader: () => ({
    isRazorpayLoaded: true,
    isRazorpayLoadFailed: false,
  }),
}));

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    trigger: mocks.trigger,
    setFocus: mocks.setFocus,
    getValues: mocks.getValues,
    formState: { errors: {} },
  }),
}));

type CapturedOptions = {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) => void;
  modal: {
    ondismiss: () => void;
  };
};

describe('RazorpayCheckoutButton', () => {
  let capturedOptions: CapturedOptions | undefined;
  let paymentFailedHandler: (() => void) | undefined;
  const open = vi.fn();
  const on = vi.fn((event: string, handler: () => void) => {
    if (event === 'payment.failed') paymentFailedHandler = handler;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    capturedOptions = undefined;
    paymentFailedHandler = undefined;
    mocks.trigger.mockResolvedValue(true);
    mocks.flush.mockResolvedValue({
      latestOrder: {
        id: 'draft-order-1',
        totals: { total: { value: 2500, currencyCode: 'INR' } },
        billing: {
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'buyer@example.com',
          phone: '(201) 555-0123',
          address: { countryCode: 'US' },
        },
      },
    });
    mocks.authorize.mockResolvedValue({
      fundingSource: { paymentReference: 'order_razorpay_123' },
      references: [
        { type: 'ORDER', value: 'draft-order-1' },
        { type: 'MERCHANT_PUBLIC_KEY', value: 'rzp_test_public' },
      ],
    });
    mocks.confirm.mockResolvedValue(undefined);

    Object.defineProperty(window, 'Razorpay', {
      configurable: true,
      value: class {
        constructor(options: CapturedOptions) {
          capturedOptions = options;
        }

        open = open;
        on = on;
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('authorizes an order, opens Checkout, and confirms the signed handler payload', async () => {
    render(<RazorpayCheckoutButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));

    await waitFor(() => {
      expect(open).toHaveBeenCalledOnce();
    });

    expect(mocks.flush).toHaveBeenCalledWith({
      includeCurrentFormDiff: true,
    });
    expect(mocks.authorize).toHaveBeenCalledWith({
      paymentType: 'razorpay',
      paymentProvider: 'RAZORPAY',
    });
    expect(capturedOptions).toMatchObject({
      key: 'rzp_test_public',
      amount: 2500,
      currency: 'INR',
      name: 'Test Store',
      description: 'draft-order-1',
      order_id: 'order_razorpay_123',
      prefill: {
        name: 'Test Buyer',
        email: 'buyer@example.com',
        contact: '+12015550123',
      },
    });
    expect(on).toHaveBeenCalledWith('payment.failed', expect.any(Function));

    capturedOptions?.handler({
      razorpay_payment_id: 'pay_razorpay_456',
      razorpay_order_id: 'order_razorpay_123',
      razorpay_signature: 'signature_789',
    });

    await waitFor(() => {
      expect(mocks.confirm).toHaveBeenCalledOnce();
    });

    const confirmInput = mocks.confirm.mock.calls[0][0];
    expect(confirmInput).toMatchObject({
      paymentType: 'razorpay',
      paymentProvider: 'RAZORPAY',
    });
    const base64 = confirmInput.paymentToken
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    expect(JSON.parse(atob(padded))).toEqual({
      v: 1,
      paymentId: 'pay_razorpay_456',
      orderId: 'order_razorpay_123',
      signature: 'signature_789',
    });
  });

  it('preserves a transport error when confirmation unmounts the button', async () => {
    let rejectConfirmation: ((reason: Error) => void) | undefined;
    mocks.confirm.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectConfirmation = reject;
        })
    );
    const view = render(<RazorpayCheckoutButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));
    await waitFor(() => expect(open).toHaveBeenCalledOnce());

    act(() => {
      capturedOptions?.handler({
        razorpay_payment_id: 'pay_razorpay_456',
        razorpay_order_id: 'order_razorpay_123',
        razorpay_signature: 'signature_789',
      });
    });
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledOnce());

    // PaymentForm replaces the provider button while confirmation is pending.
    view.unmount();
    await act(async () => {
      rejectConfirmation?.(new Error('Network unavailable'));
    });

    expect(mocks.setCheckoutErrors).toHaveBeenCalledWith([
      'TRANSACTION_PROCESSING_FAILED',
    ]);

    // The checkout-level error survives when PaymentForm mounts the button again.
    render(<RazorpayCheckoutButton />);
    expect(mocks.setCheckoutErrors).toHaveBeenCalledWith([
      'TRANSACTION_PROCESSING_FAILED',
    ]);
  });

  it('waits for the checkout sync to settle before authorizing', async () => {
    let resolveFlush: ((value: unknown) => void) | undefined;
    mocks.flush.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFlush = resolve;
        })
    );

    render(<RazorpayCheckoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));

    await waitFor(() => expect(mocks.flush).toHaveBeenCalledOnce());
    // Authorize must see the synced totals, so it cannot start while the
    // buyer's pending form edits are still in flight.
    expect(mocks.authorize).not.toHaveBeenCalled();

    await act(async () => {
      resolveFlush?.({
        latestOrder: {
          id: 'draft-order-1',
          totals: { total: { value: 4200, currencyCode: 'INR' } },
        },
      });
    });

    await waitFor(() => expect(open).toHaveBeenCalledOnce());
    expect(mocks.authorize).toHaveBeenCalledOnce();
    expect(capturedOptions?.amount).toBe(4200);
  });

  it('allows only one payment attempt while validation is pending', async () => {
    let resolveValidation: ((valid: boolean) => void) | undefined;
    mocks.trigger.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveValidation = resolve;
        })
    );

    render(<RazorpayCheckoutButton />);
    const payButton = screen.getByRole('button', { name: 'Pay now' });
    fireEvent.click(payButton);
    fireEvent.click(payButton);

    expect(mocks.trigger).toHaveBeenCalledOnce();
    expect(mocks.flush).not.toHaveBeenCalled();
    expect(mocks.authorize).not.toHaveBeenCalled();

    await act(async () => {
      resolveValidation?.(true);
    });

    await waitFor(() => expect(open).toHaveBeenCalledOnce());
    expect(mocks.flush).toHaveBeenCalledOnce();
    expect(mocks.authorize).toHaveBeenCalledOnce();
  });

  it('does not open Checkout when authorization resolves after unmount', async () => {
    let resolveAuthorization: ((value: unknown) => void) | undefined;
    mocks.authorize.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveAuthorization = resolve;
        })
    );
    const view = render(<RazorpayCheckoutButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));
    await waitFor(() => expect(mocks.authorize).toHaveBeenCalledOnce());
    view.unmount();

    await act(async () => {
      resolveAuthorization?.({
        fundingSource: { paymentReference: 'order_stale_123' },
        references: [{ type: 'MERCHANT_PUBLIC_KEY', value: 'rzp_test_stale' }],
      });
    });

    expect(open).not.toHaveBeenCalled();
    expect(capturedOptions).toBeUndefined();
  });

  it('keeps a remounted attempt isolated from stale authorization', async () => {
    let resolveFirstAuthorization: ((value: unknown) => void) | undefined;
    mocks.authorize
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirstAuthorization = resolve;
          })
      )
      .mockResolvedValueOnce({
        fundingSource: { paymentReference: 'order_fresh_456' },
        references: [{ type: 'MERCHANT_PUBLIC_KEY', value: 'rzp_test_fresh' }],
      });
    const firstView = render(<RazorpayCheckoutButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));
    await waitFor(() => expect(mocks.authorize).toHaveBeenCalledOnce());
    firstView.unmount();

    render(<RazorpayCheckoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));
    await waitFor(() => expect(open).toHaveBeenCalledOnce());
    expect(capturedOptions).toMatchObject({
      key: 'rzp_test_fresh',
      order_id: 'order_fresh_456',
    });

    await act(async () => {
      resolveFirstAuthorization?.({
        fundingSource: { paymentReference: 'order_stale_123' },
        references: [{ type: 'MERCHANT_PUBLIC_KEY', value: 'rzp_test_stale' }],
      });
    });

    expect(open).toHaveBeenCalledOnce();
    expect(capturedOptions).toMatchObject({
      key: 'rzp_test_fresh',
      order_id: 'order_fresh_456',
    });
  });

  it('does not confirm when Razorpay reports a failed payment', async () => {
    render(<RazorpayCheckoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));

    await waitFor(() => expect(open).toHaveBeenCalledOnce());
    act(() => {
      paymentFailedHandler?.();
    });

    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(screen.getByText('Error processing payment')).toBeTruthy();
  });

  it.each([
    {
      name: 'order ID',
      authorization: {
        fundingSource: { paymentReference: null },
        references: [{ type: 'MERCHANT_PUBLIC_KEY', value: 'rzp_test_public' }],
      },
    },
    {
      name: 'merchant public key',
      authorization: {
        fundingSource: { paymentReference: 'order_razorpay_123' },
        references: [],
      },
    },
  ])(
    'does not open Checkout when authorize omits the $name',
    async ({ authorization }) => {
      mocks.authorize.mockResolvedValue(authorization);
      render(<RazorpayCheckoutButton />);

      fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));

      await waitFor(() => {
        expect(screen.getByText('Error processing payment')).toBeTruthy();
      });
      expect(open).not.toHaveBeenCalled();
      expect(mocks.confirm).not.toHaveBeenCalled();
    }
  );

  it('does not impose a client timeout on an active Checkout session', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    render(<RazorpayCheckoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));

    await waitFor(() => expect(open).toHaveBeenCalledOnce());
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(
      expect.any(Function),
      2 * 60 * 1000
    );
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
});
