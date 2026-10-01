import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutConfirmationBlockedError } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { StripeExpressCheckoutForm } from './stripe';

const mocks = vi.hoisted(() => ({
  handleSubmit: vi.fn(),
  track: vi.fn(),
  onConfirm: undefined as
    | ((event: StripeExpressCheckoutElementConfirmEvent) => Promise<void>)
    | undefined,
}));

vi.mock('@stripe/react-stripe-js', () => ({
  ExpressCheckoutElement: (props: { onConfirm: typeof mocks.onConfirm }) => {
    mocks.onConfirm = props.onConfirm;
    return null;
  },
  useElements: () => null,
}));
vi.mock('@/components/checkout/checkout', () => ({
  useCheckoutContext: () => ({
    session: { id: 'session-1' },
    setCheckoutErrors: vi.fn(),
    isConfirmingCheckout: false,
  }),
}));
vi.mock('@/godaddy-provider', () => ({
  useGoDaddyContext: () => ({
    t: {
      errors: { errorProcessingPayment: 'Error processing payment' },
      totals: {
        discount: 'Discount',
        estimatedTaxes: 'Estimated taxes',
        shipping: 'Shipping',
        subtotal: 'Subtotal',
      },
    },
  }),
}));
vi.mock('@/components/checkout/payment/utils/use-stripe-checkout', () => ({
  useStripeCheckout: () => ({ handleSubmit: mocks.handleSubmit }),
}));
vi.mock('@/components/checkout/order/use-draft-order', () => ({
  useDraftOrder: () => ({ data: undefined }),
  useDraftOrderTotals: () => ({ data: undefined }),
}));
vi.mock('@/components/checkout/payment/utils/use-is-payment-disabled', () => ({
  useIsPaymentDisabled: () => false,
}));
vi.mock(
  '@/components/checkout/shipping/utils/use-get-shipping-methods',
  () => ({ useGetShippingMethodByAddress: () => vi.fn() })
);
vi.mock('@/components/checkout/taxes/utils/use-get-taxes', () => ({
  useGetTaxes: () => vi.fn(),
}));
vi.mock(
  '@/components/checkout/discount/utils/use-get-price-adjustments',
  () => ({ useGetPriceAdjustments: () => vi.fn() })
);
vi.mock('@/tracking/track', () => ({
  track: mocks.track,
  TrackingEventType: { EVENT: 'event' },
}));

function confirmEvent() {
  return {
    expressPaymentType: 'google_pay',
    paymentFailed: vi.fn(),
  } as unknown as StripeExpressCheckoutElementConfirmEvent & {
    paymentFailed: ReturnType<typeof vi.fn>;
  };
}

describe('StripeExpressCheckoutForm confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onConfirm = undefined;
    render(<StripeExpressCheckoutForm />);
  });

  it('closes the wallet sheet when confirmation is blocked, without reporting a payment error', async () => {
    mocks.handleSubmit.mockRejectedValueOnce(
      new CheckoutConfirmationBlockedError('Checkout is currently busy')
    );
    const event = confirmEvent();

    await mocks.onConfirm?.(event);

    expect(event.paymentFailed).toHaveBeenCalledWith({
      reason: 'fail',
      message: 'Error processing payment',
    });
    expect(mocks.track).not.toHaveBeenCalled();
  });

  it('closes the wallet sheet and tracks the error when payment fails', async () => {
    mocks.handleSubmit.mockRejectedValueOnce(new Error('declined'));
    const event = confirmEvent();

    await mocks.onConfirm?.(event);

    expect(event.paymentFailed).toHaveBeenCalledTimes(1);
    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ errorType: 'declined' }),
      })
    );
  });

  it('leaves the wallet sheet to the payment flow on success', async () => {
    mocks.handleSubmit.mockResolvedValueOnce(undefined);
    const event = confirmEvent();

    await mocks.onConfirm?.(event);

    expect(event.paymentFailed).not.toHaveBeenCalled();
  });
});
