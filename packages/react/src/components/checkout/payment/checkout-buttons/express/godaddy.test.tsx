import { enUs } from '@godaddy/localizations';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DraftOrder } from '@/types';
import { ExpressCheckoutButton } from './godaddy';

type Handler = (event: Record<string, unknown>) => Promise<void> | void;

const mocks = vi.hoisted(() => ({
  draftOrder: null as unknown,
  getPriceAdjustments: vi.fn(),
  getShippingMethods: vi.fn(),
  getTaxes: vi.fn(),
  setCheckoutErrors: vi.fn(),
  mountOptions: null as null | {
    buttonOptions: { onClick: (args: { source?: string }) => unknown };
  },
  abortApplePaySession: vi.fn(),
  tokenizeOptions: [] as Array<Record<string, unknown>>,
  handlers: {} as Record<string, Handler>,
}));

vi.mock('@/components/checkout/checkout', () => ({
  useCheckoutContext: () => ({
    session: {
      id: 'session-1',
      storeId: 'store-1',
      channelId: 'channel-1',
      enablePromotionCodes: true,
      enableShippingAddressCollection: true,
      enableTaxCollection: false,
    },
    godaddyPaymentsConfig: { appId: 'app-1', businessId: 'business-1' },
    setCheckoutErrors: mocks.setCheckoutErrors,
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
  useGetTaxes: () => ({ mutateAsync: mocks.getTaxes }),
}));
vi.mock('@/components/checkout/payment/utils/use-load-poynt-collect', () => ({
  useLoadPoyntCollect: () => ({ isPoyntLoaded: true }),
}));
vi.mock(
  '@/components/checkout/payment/utils/use-build-payment-request',
  () => ({
    useBuildPaymentRequest: () => ({
      poyntExpressRequest: {
        lineItems: [],
        total: { label: 'Total', amount: '25.00' },
      },
    }),
  })
);
vi.mock(
  '@/components/checkout/payment/utils/use-confirm-express-checkout',
  () => ({ useConfirmExpressCheckout: () => ({ mutateAsync: vi.fn() }) })
);
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

class FakeTokenizeJs {
  constructor(_config: unknown, options: Record<string, unknown>) {
    mocks.tokenizeOptions.push(options);
  }
  supportWalletPayments() {
    return Promise.resolve({ applePay: true, googlePay: false });
  }
  mount(_id: string, _document: Document, options: typeof mocks.mountOptions) {
    mocks.mountOptions = options;
  }
  startApplePaySession() {
    return undefined;
  }
  startGooglePaySession() {
    return undefined;
  }
  abortApplePaySession() {
    mocks.abortApplePaySession();
  }
  on(event: string, handler: Handler) {
    mocks.handlers[event] = handler;
  }
}

function draftOrder({
  subTotal = 2500,
  id = 'draft-order-1',
  shippingOnly = false,
}: {
  subTotal?: number;
  id?: string;
  shippingOnly?: boolean;
} = {}) {
  if (shippingOnly) {
    return {
      id,
      totals: {
        subTotal: { value: subTotal, currencyCode: 'USD' },
        total: { value: subTotal, currencyCode: 'USD' },
      },
      discounts: [],
      lineItems: [{ id: 'line-1', discounts: [] }],
      shippingLines: [
        { discounts: [{ code: 'FREESHIP', amount: { value: 1000 } }] },
      ],
    } as unknown as DraftOrder;
  }

  return {
    id,
    totals: {
      subTotal: { value: subTotal, currencyCode: 'USD' },
      total: { value: subTotal, currencyCode: 'USD' },
    },
    discounts: [{ code: 'SAVE5', amount: { value: 500 } }],
    lineItems: [
      { id: 'line-1', discounts: [{ code: 'BIG', amount: { value: 400 } }] },
      { id: 'line-2', discounts: [{ code: 'BIG', amount: { value: 400 } }] },
    ],
    shippingLines: [],
  } as unknown as DraftOrder;
}

function rate(serviceCode: string, value: number) {
  return {
    serviceCode,
    displayName: serviceCode,
    carrierCode: 'carrier',
    description: null,
    cost: { value, currencyCode: 'USD' },
  };
}

describe('ExpressCheckoutButton coupon sync', () => {
  beforeEach(() => {
    mocks.draftOrder = draftOrder();
    mocks.tokenizeOptions = [];
    mocks.handlers = {};
    mocks.getPriceAdjustments.mockReset().mockResolvedValue({
      totalDiscountAmount: { value: 800, currencyCode: 'USD' },
    });
    mocks.getShippingMethods.mockReset();
    mocks.setCheckoutErrors.mockReset();
    mocks.abortApplePaySession.mockReset();
    mocks.mountOptions = null;
    mocks.getTaxes.mockReset();
    (window as unknown as { TokenizeJs: unknown }).TokenizeJs = FakeTokenizeJs;
  });

  it('sends the highest-value coupon code to the wallet', async () => {
    render(<ExpressCheckoutButton />);

    await waitFor(() => expect(mocks.tokenizeOptions).toHaveLength(1));
    expect(mocks.getPriceAdjustments).toHaveBeenCalledWith({
      discountCodes: ['BIG'],
    });
    expect(mocks.tokenizeOptions[0].couponCode).toMatchObject({ code: 'BIG' });
  });

  it('does not prefill a shipping-only coupon before the wallet has shipping', async () => {
    mocks.draftOrder = draftOrder({ shippingOnly: true });
    render(<ExpressCheckoutButton />);

    await waitFor(() => expect(mocks.tokenizeOptions).toHaveLength(1));
    expect(mocks.getPriceAdjustments).not.toHaveBeenCalled();
    expect(mocks.tokenizeOptions[0].couponCode).toBeUndefined();
  });

  it('recomputes adjustments when the subtotal changes, not on unrelated order updates', async () => {
    const { rerender } = render(<ExpressCheckoutButton />);
    await waitFor(() => expect(mocks.getPriceAdjustments).toHaveBeenCalled());

    mocks.draftOrder = draftOrder({ id: 'draft-order-1' });
    rerender(<ExpressCheckoutButton />);
    await act(() => Promise.resolve());
    expect(mocks.getPriceAdjustments).toHaveBeenCalledTimes(1);

    mocks.draftOrder = draftOrder({ subTotal: 5000 });
    rerender(<ExpressCheckoutButton />);
    await waitFor(() =>
      expect(mocks.getPriceAdjustments).toHaveBeenCalledTimes(2)
    );
  });

  it('keeps the wallet shipping methods when a coupon changes', async () => {
    render(<ExpressCheckoutButton />);
    await waitFor(() =>
      expect(mocks.handlers.shipping_address_change).toBeDefined()
    );

    mocks.getShippingMethods.mockResolvedValueOnce([rate('standard', 1000)]);
    await act(async () => {
      await mocks.handlers.shipping_address_change({
        shippingAddress: { countryCode: 'US', postalCode: '85001' },
        updateWith: vi.fn(),
      });
    });
    expect(mocks.getShippingMethods).toHaveBeenCalledTimes(1);

    const updateWith = vi.fn();
    await act(async () => {
      await mocks.handlers.coupon_code_change({ couponCode: '', updateWith });
    });

    expect(mocks.getShippingMethods).toHaveBeenCalledTimes(1);
    expect(updateWith).toHaveBeenCalledTimes(1);
    expect(updateWith.mock.calls[0][0]).not.toHaveProperty('shippingMethods');
  });

  async function openWallet(source: 'apple_pay' | 'google_pay') {
    render(<ExpressCheckoutButton />);
    await waitFor(() => expect(mocks.mountOptions).not.toBeNull());
    await act(async () => {
      await mocks.mountOptions?.buttonOptions.onClick({ source });
    });
  }

  async function changeAddress() {
    const updateWith = vi.fn();
    await act(async () => {
      await mocks.handlers.shipping_address_change({
        shippingAddress: { countryCode: 'US', postalCode: '85001' },
        updateWith,
      });
    });
    return updateWith;
  }

  it('tells the wallet no shipping methods were found when there are no rates', async () => {
    await openWallet('google_pay');
    mocks.getShippingMethods.mockResolvedValueOnce([]);

    const updateWith = await changeAddress();

    expect(updateWith).toHaveBeenCalledWith({
      error: {
        code: 'invalid_shipping_address',
        message: enUs.shipping.noShippingMethods,
      },
    });
  });

  it('tells the wallet shipping methods failed to load when the request fails', async () => {
    await openWallet('google_pay');
    mocks.getShippingMethods.mockRejectedValueOnce(new Error('rates failed'));

    const updateWith = await changeAddress();

    expect(updateWith).toHaveBeenCalledOnce();
    expect(updateWith).toHaveBeenCalledWith({
      error: { code: 'unknown', message: enUs.shipping.failedToLoadMethods },
    });
    expect(mocks.abortApplePaySession).not.toHaveBeenCalled();
  });

  it('closes the Apple Pay sheet and shows the error when the rates request fails', async () => {
    await openWallet('apple_pay');
    mocks.getShippingMethods.mockRejectedValueOnce(new Error('rates failed'));

    const updateWith = await changeAddress();

    expect(updateWith).not.toHaveBeenCalled();
    expect(mocks.abortApplePaySession).toHaveBeenCalledOnce();
    expect(mocks.setCheckoutErrors).toHaveBeenLastCalledWith([
      enUs.shipping.failedToLoadMethods,
    ]);
  });
});
