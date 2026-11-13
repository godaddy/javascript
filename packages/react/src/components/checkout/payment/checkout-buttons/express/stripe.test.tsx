import { enUs } from '@godaddy/localizations';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DraftOrder } from '@/types';
import { StripeExpressCheckoutForm } from './stripe';

const mocks = vi.hoisted(() => ({
  draftOrder: null as unknown,
  getPriceAdjustments: vi.fn(),
  getShippingMethods: vi.fn(),
  elementProps: {} as Record<string, (event: unknown) => unknown>,
}));

vi.mock('@stripe/react-stripe-js', () => ({
  ExpressCheckoutElement: (
    props: Record<string, (event: unknown) => unknown>
  ) => {
    mocks.elementProps = props;
    return null;
  },
  useElements: () => ({ update: vi.fn() }),
}));
vi.mock('@/components/checkout/checkout', () => ({
  useCheckoutContext: () => ({
    session: {
      id: 'session-1',
      enablePromotionCodes: true,
      enableShippingAddressCollection: true,
      enableTaxCollection: false,
    },
    setCheckoutErrors: vi.fn(),
    isConfirmingCheckout: false,
  }),
}));
vi.mock('@/components/checkout/order/use-draft-order', () => ({
  useDraftOrder: () => ({ data: mocks.draftOrder }),
  useDraftOrderTotals: () => ({
    data: (mocks.draftOrder as DraftOrder | null)?.totals,
  }),
}));
vi.mock(
  '@/components/checkout/discount/utils/use-get-price-adjustments',
  () => ({
    useGetPriceAdjustments: () => ({ mutateAsync: mocks.getPriceAdjustments }),
  })
);
vi.mock(
  '@/components/checkout/shipping/utils/use-get-shipping-methods',
  () => ({
    useGetShippingMethodByAddress: () => ({
      mutateAsync: mocks.getShippingMethods,
    }),
  })
);
vi.mock('@/components/checkout/taxes/utils/use-get-taxes', () => ({
  useGetTaxes: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/components/checkout/payment/utils/use-stripe-checkout', () => ({
  useStripeCheckout: () => ({ handleSubmit: vi.fn() }),
}));
vi.mock('@/components/checkout/payment/utils/use-is-payment-disabled', () => ({
  useIsPaymentDisabled: () => false,
}));
vi.mock('@/godaddy-provider', () => ({
  useGoDaddyContext: () => ({ t: enUs, locale: 'en-US' }),
}));
vi.mock('@/tracking/track', async importOriginal => ({
  ...(await importOriginal<typeof import('@/tracking/track')>()),
  track: vi.fn(),
}));

function draftOrder({
  subTotal = 2500,
  lineCode = 'BIG',
}: {
  subTotal?: number;
  lineCode?: string;
} = {}) {
  return {
    id: 'draft-order-1',
    totals: {
      subTotal: { value: subTotal, currencyCode: 'USD' },
      total: { value: subTotal, currencyCode: 'USD' },
    },
    discounts: [{ code: 'SAVE5', amount: { value: 500 } }],
    lineItems: [
      { id: 'line-1', discounts: [{ code: lineCode, amount: { value: 800 } }] },
    ],
    shippingLines: [],
  } as unknown as DraftOrder;
}

describe('StripeExpressCheckoutForm coupon sync', () => {
  beforeEach(() => {
    mocks.draftOrder = draftOrder();
    mocks.elementProps = {};
    mocks.getPriceAdjustments.mockReset().mockResolvedValue({
      totalDiscountAmount: { value: 800, currencyCode: 'USD' },
    });
    mocks.getShippingMethods.mockReset().mockResolvedValue([
      {
        serviceCode: 'standard',
        displayName: 'Standard',
        carrierCode: 'carrier',
        description: null,
        cost: { value: 1000, currencyCode: 'USD' },
      },
    ]);
  });

  it('uses the highest-value coupon code', async () => {
    render(<StripeExpressCheckoutForm />);

    await waitFor(() =>
      expect(mocks.getPriceAdjustments).toHaveBeenCalledWith({
        discountCodes: ['BIG'],
      })
    );
  });

  it('recomputes adjustments when the subtotal changes, not on unrelated order updates', async () => {
    const { rerender } = render(<StripeExpressCheckoutForm />);
    await waitFor(() => expect(mocks.getPriceAdjustments).toHaveBeenCalled());

    mocks.draftOrder = draftOrder();
    rerender(<StripeExpressCheckoutForm />);
    await act(() => Promise.resolve());
    expect(mocks.getPriceAdjustments).toHaveBeenCalledTimes(1);

    mocks.draftOrder = draftOrder({ subTotal: 5000 });
    rerender(<StripeExpressCheckoutForm />);
    await waitFor(() =>
      expect(mocks.getPriceAdjustments).toHaveBeenCalledTimes(2)
    );
  });

  it('does not refetch or reselect shipping when the coupon changes while the sheet is open', async () => {
    const { rerender } = render(<StripeExpressCheckoutForm />);
    await waitFor(() => expect(mocks.getPriceAdjustments).toHaveBeenCalled());

    await act(async () => {
      await mocks.elementProps.onShippingAddressChange({
        address: {
          city: 'Phoenix',
          state: 'AZ',
          postal_code: '85001',
          country: 'US',
        },
        resolve: vi.fn(),
        reject: vi.fn(),
      });
    });
    expect(mocks.getShippingMethods).toHaveBeenCalledTimes(1);
    const priceAdjustmentCalls = mocks.getPriceAdjustments.mock.calls.length;

    mocks.draftOrder = draftOrder({ lineCode: 'BIGGER' });
    rerender(<StripeExpressCheckoutForm />);
    await waitFor(() =>
      expect(mocks.getPriceAdjustments).toHaveBeenCalledTimes(
        priceAdjustmentCalls + 1
      )
    );
    await act(() => Promise.resolve());

    expect(mocks.getShippingMethods).toHaveBeenCalledTimes(1);
  });
});
