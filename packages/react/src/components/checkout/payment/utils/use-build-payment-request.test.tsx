import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GoDaddyProvider } from '@/godaddy-provider';
import type { CheckoutSession, DraftOrder, SKUProduct } from '@/types';
import {
  buildBillingAddress,
  buildCheckoutSession,
  buildDraftOrder,
  buildLineItem,
  buildShippingAddress,
  createTestQueryClient,
} from '../../__tests__/checkout-test-env';
import { useBuildPaymentRequest } from './use-build-payment-request';

type PaymentRequests = ReturnType<typeof useBuildPaymentRequest>;

type DeepPartial<T> = T extends Array<infer U>
  ? Array<DeepPartial<NonNullable<U>>>
  : T extends object
    ? {
        [K in keyof T]?: DeepPartial<NonNullable<T[K]>> | Extract<T[K], null>;
      }
    : T;

function money(value: number, currencyCode = 'USD') {
  return { value, currencyCode };
}

function productNode(overrides: Partial<SKUProduct> = {}): SKUProduct {
  return {
    id: 'sku-node-1',
    code: 'sku-1',
    label: 'Test Product',
    name: 'Test Product',
    description: null,
    status: 'ACTIVE',
    weight: null,
    unitOfWeight: null,
    disableShipping: null,
    htmlDescription: null,
    prices: [],
    attributes: [],
    attributeValues: [],
    ...overrides,
  } as SKUProduct;
}

function FormWrapper({
  defaultValues,
  children,
}: {
  defaultValues?: Partial<CheckoutFormData>;
  children: React.ReactNode;
}) {
  const methods = useForm<CheckoutFormData>({
    defaultValues: defaultValues ?? {},
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

function PaymentRequestProbe({
  onRequests,
}: {
  onRequests: (requests: PaymentRequests) => void;
}) {
  const requests = useBuildPaymentRequest();

  React.useEffect(() => {
    onRequests(requests);
  }, [onRequests, requests]);

  return null;
}

async function renderUseBuildPaymentRequest({
  draftOrderOverrides,
  sessionOverrides,
  products = [productNode()],
  formDefaultValues,
}: {
  draftOrderOverrides?: DeepPartial<DraftOrder>;
  sessionOverrides?: DeepPartial<CheckoutSession>;
  products?: SKUProduct[];
  formDefaultValues?: Partial<CheckoutFormData>;
} = {}) {
  const queryClient = createTestQueryClient();
  const draftOrder = buildDraftOrder(draftOrderOverrides);
  const session = buildCheckoutSession({
    ...(sessionOverrides ?? {}),
    draftOrder,
  });
  const onRequests = vi.fn();

  queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
    checkoutSession: {
      ...session,
      draftOrder,
    },
  });
  queryClient.setQueryData(checkoutQueryKeys.draftOrderProducts(session.id), {
    checkoutSession: {
      skus: {
        edges: products.map(node => ({ node })),
      },
    },
  });

  render(
    <GoDaddyProvider queryClient={queryClient} locale='en-US'>
      <checkoutContext.Provider
        value={{
          session,
          isConfirmingCheckout: false,
          setIsConfirmingCheckout: () => undefined,
          checkoutErrors: undefined,
          setCheckoutErrors: () => undefined,
        }}
      >
        <FormWrapper defaultValues={formDefaultValues}>
          <PaymentRequestProbe onRequests={onRequests} />
        </FormWrapper>
      </checkoutContext.Provider>
    </GoDaddyProvider>
  );

  await waitFor(() => expect(onRequests).toHaveBeenCalled());

  return {
    requests: onRequests.mock.calls.at(-1)?.[0] as PaymentRequests,
    queryClient,
    session,
    draftOrder,
  };
}

describe('useBuildPaymentRequest', () => {
  it('builds Apple Pay, Google Pay, and PayPal request shapes from draft-order totals', async () => {
    const lineItem = buildLineItem({
      name: 'Coffee Mug',
      quantity: 2,
      details: { sku: 'mug-sku' },
      totals: {
        subTotal: money(5000),
        discountTotal: money(0),
        feeTotal: money(0),
        taxTotal: money(0),
      },
      unitAmount: money(2500),
    });

    const { requests } = await renderUseBuildPaymentRequest({
      draftOrderOverrides: {
        billing: {
          firstName: 'Bill',
          lastName: 'Buyer',
          email: 'bill@example.com',
          phone: '+12015550124',
          address: buildBillingAddress({
            addressLine1: '1 Billing Way',
            addressLine2: 'Suite 3',
            adminArea2: 'Tempe',
            adminArea1: 'AZ',
            postalCode: '85284',
            countryCode: 'US',
          }),
        },
        shipping: {
          firstName: 'Ship',
          lastName: 'Buyer',
          email: 'ship@example.com',
          phone: '+12015550125',
          address: buildShippingAddress({
            addressLine1: '9 Shipping Ln',
            addressLine2: 'Unit 2',
            adminArea2: 'Jasper',
            adminArea1: 'GA',
            postalCode: '30143',
            countryCode: 'US',
          }),
        },
        lineItems: [lineItem],
        shippingLines: [
          {
            id: 'shipping-line-1',
            requestedService: 'ground',
            requestedProvider: 'shippo',
            name: 'Ground',
            amount: money(1000),
            discounts: [],
          },
        ],
        totals: {
          subTotal: money(5000),
          discountTotal: money(500),
          shippingTotal: money(1000),
          taxTotal: money(150),
          feeTotal: money(0),
          total: money(5650),
        },
      },
      products: [productNode({ code: 'mug-sku', label: 'Coffee Mug' })],
    });

    expect(requests.applePayRequest).toMatchObject({
      countryCode: 'US',
      currencyCode: 'USD',
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      total: {
        label: 'Order Total',
        amount: '$56.50',
        type: 'final',
      },
    });
    expect(requests.applePayRequest.lineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Coffee Mug',
          amount: '$50.00',
          type: 'LINE_ITEM',
          status: 'FINAL',
        }),
        expect.objectContaining({ label: 'Subtotal', amount: '$50.00' }),
        expect.objectContaining({ label: 'Tax', amount: '$1.50' }),
        expect.objectContaining({ label: 'Shipping', amount: '$10.00' }),
        expect.objectContaining({ label: 'Discount', amount: '-$5.00' }),
      ])
    );

    expect(requests.googlePayRequest).toMatchObject({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        expect.objectContaining({
          type: 'CARD',
          parameters: expect.objectContaining({
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: [
              'AMEX',
              'DISCOVER',
              'JCB',
              'MASTERCARD',
              'VISA',
            ],
          }),
        }),
      ],
      merchantInfo: {
        merchantId: 'store-1',
        merchantName: 'Test Store',
        merchantOrigin: 'localhost',
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: '$56.50',
        totalPriceLabel: 'Total',
        currencyCode: 'USD',
      },
    });
    expect(requests.googlePayRequest.transactionInfo.displayItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Coffee Mug',
          price: 5000,
          type: 'LINE_ITEM',
          status: 'FINAL',
        }),
        expect.objectContaining({ label: 'Subtotal', price: 50 }),
        expect.objectContaining({ label: 'Tax', price: 1.5 }),
        expect.objectContaining({ label: 'Shipping', price: 10 }),
        expect.objectContaining({ label: 'Discount', price: -5 }),
      ])
    );

    expect(requests.payPalRequest.purchase_units[0]).toMatchObject({
      amount: {
        currency_code: 'USD',
        value: '56.50',
        breakdown: {
          item_total: { currency_code: 'USD', value: '50.00' },
          tax_total: { currency_code: 'USD', value: '1.50' },
          shipping: { currency_code: 'USD', value: '10.00' },
          discount: { currency_code: 'USD', value: '5.00' },
        },
      },
      items: [
        {
          name: 'Coffee Mug',
          unit_amount: { currency_code: 'USD', value: '25.00' },
          quantity: '2',
        },
      ],
      shipping: {
        name: { full_name: 'Ship Buyer' },
        address: {
          address_line_1: '9 Shipping Ln',
          address_line_2: 'Unit 2',
          admin_area_2: 'Jasper',
          admin_area_1: 'GA',
          postal_code: '30143',
          country_code: 'US',
        },
      },
      billing: {
        name: { full_name: 'Bill Buyer' },
        address: {
          address_line_1: '1 Billing Way',
          address_line_2: 'Suite 3',
          admin_area_2: 'Tempe',
          admin_area_1: 'AZ',
          postal_code: '85284',
          country_code: 'US',
        },
      },
    });
  });

  it('builds zero-total requests for free orders without invoking payment SDKs', async () => {
    const { requests } = await renderUseBuildPaymentRequest({
      draftOrderOverrides: {
        lineItems: [],
        shippingLines: [],
        totals: {
          subTotal: money(0),
          discountTotal: money(0),
          shippingTotal: money(0),
          taxTotal: money(0),
          feeTotal: money(0),
          total: money(0),
        },
      },
      products: [],
    });

    expect(requests.applePayRequest.total.amount).toBe('$0.00');
    expect(requests.googlePayRequest.transactionInfo.totalPrice).toBe('$0.00');
    expect(requests.payPalRequest.purchase_units[0].amount.value).toBe('0.00');
    expect(requests.poyntStandardRequest.total.amount).toBe('0.00');
    expect(requests.squarePaymentRequest.amount).toBe('0.00');
  });

  it('preserves three-decimal KWD precision for raw payment request amounts', async () => {
    const { requests } = await renderUseBuildPaymentRequest({
      sessionOverrides: {
        shipping: {
          originAddress: {
            countryCode: 'KW',
          },
        },
      },
      draftOrderOverrides: {
        lineItems: [
          buildLineItem({
            name: 'KWD Product',
            quantity: 1,
            details: { sku: 'kwd-sku' },
            totals: {
              subTotal: money(1234, 'KWD'),
              discountTotal: money(0, 'KWD'),
              feeTotal: money(0, 'KWD'),
              taxTotal: money(0, 'KWD'),
            },
            unitAmount: money(1234, 'KWD'),
          }),
        ],
        shippingLines: [],
        totals: {
          subTotal: money(1234, 'KWD'),
          discountTotal: money(0, 'KWD'),
          shippingTotal: money(0, 'KWD'),
          taxTotal: money(0, 'KWD'),
          feeTotal: money(0, 'KWD'),
          total: money(1234, 'KWD'),
        },
      },
      products: [productNode({ code: 'kwd-sku', label: 'KWD Product' })],
    });

    expect(requests.payPalRequest.purchase_units[0].amount).toMatchObject({
      currency_code: 'KWD',
      value: '1.234',
    });
    expect(requests.payPalRequest.purchase_units[0].items[0]).toMatchObject({
      name: 'KWD Product',
      unit_amount: { currency_code: 'KWD', value: '1.234' },
      quantity: '1',
    });
    expect(requests.poyntStandardRequest.total.amount).toBe('1.234');
    expect(requests.squarePaymentRequest.amount).toBe('1.234');
    expect(requests.googlePayRequest.transactionInfo.totalPrice).toContain(
      '1.234'
    );
  });

  it('includes tipAmount in payment request totals when enableTips is true', async () => {
    const { requests } = await renderUseBuildPaymentRequest({
      sessionOverrides: {
        enableTips: true,
      },
      draftOrderOverrides: {
        lineItems: [
          buildLineItem({
            name: 'Coffee Mug',
            quantity: 1,
            details: { sku: 'mug-sku' },
            totals: {
              subTotal: money(2000),
              discountTotal: money(0),
              feeTotal: money(0),
              taxTotal: money(0),
            },
            unitAmount: money(2000),
          }),
        ],
        shippingLines: [],
        totals: {
          subTotal: money(2000),
          discountTotal: money(0),
          shippingTotal: money(0),
          taxTotal: money(0),
          feeTotal: money(0),
          total: money(2000),
        },
      },
      products: [productNode({ code: 'mug-sku', label: 'Coffee Mug' })],
      formDefaultValues: { tipAmount: 500 },
    });

    // Apple Pay total includes tip
    expect(requests.applePayRequest.total.amount).toBe('$25.00');
    expect(requests.applePayRequest.lineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Tip',
          amount: '$5.00',
          type: 'final',
        }),
      ])
    );

    // Google Pay total includes tip
    expect(requests.googlePayRequest.transactionInfo.totalPrice).toBe('$25.00');
    expect(requests.googlePayRequest.transactionInfo.displayItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Tip',
          price: 5,
          type: 'LINE_ITEM',
          status: 'FINAL',
        }),
      ])
    );

    // PayPal total includes tip in breakdown and items
    expect(requests.payPalRequest.purchase_units[0].amount.value).toBe('25.00');
    expect(
      requests.payPalRequest.purchase_units[0].amount.breakdown.item_total.value
    ).toBe('25.00');
    expect(requests.payPalRequest.purchase_units[0].items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Tip',
          unit_amount: { currency_code: 'USD', value: '5.00' },
          quantity: '1',
        }),
      ])
    );

    // Square total includes tip
    expect(requests.squarePaymentRequest.amount).toBe('25.00');

    // Poynt Express total includes tip
    expect(requests.poyntExpressRequest.total.amount).toBe('25.00');

    // Poynt Express includes tip line item so recomputed wallet totals keep it
    expect(requests.poyntExpressRequest.lineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Tip', amount: '5.00' }),
      ])
    );

    // Poynt Standard includes tip line item
    expect(requests.poyntStandardRequest.lineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Tip', amount: '5.00' }),
      ])
    );
  });

  it('includes tax and tip in poyntExpressRequest.total.amount when applicable', async () => {
    const { requests } = await renderUseBuildPaymentRequest({
      sessionOverrides: {
        enableTips: true,
      },
      draftOrderOverrides: {
        lineItems: [
          buildLineItem({
            name: 'Coffee Mug',
            quantity: 1,
            details: { sku: 'mug-sku' },
            totals: {
              subTotal: money(2000),
              discountTotal: money(0),
              feeTotal: money(0),
              taxTotal: money(200),
            },
            unitAmount: money(2000),
          }),
        ],
        shippingLines: [],
        totals: {
          subTotal: money(2000),
          discountTotal: money(0),
          shippingTotal: money(0),
          taxTotal: money(200),
          feeTotal: money(0),
          total: money(2200),
        },
      },
      products: [productNode({ code: 'mug-sku', label: 'Coffee Mug' })],
      formDefaultValues: { tipAmount: 300 },
    });

    // total is $22.00 (subtotal $20 + tax $2) + tip $3 = $25.00
    expect(requests.poyntExpressRequest.total.amount).toBe('25.00');
  });

  it('charges the full order total, not the subtotal, when tips are disabled', async () => {
    // poyntExpressRequest.total used to be the bare subtotal, which under-charged
    // any order carrying tax, shipping or a discount. Keep subtotal and total
    // distinct here so a regression cannot hide behind equal fixtures.
    const { requests } = await renderUseBuildPaymentRequest({
      sessionOverrides: {
        enableTips: false,
      },
      draftOrderOverrides: {
        lineItems: [
          buildLineItem({
            name: 'Coffee Mug',
            quantity: 1,
            details: { sku: 'mug-sku' },
            totals: {
              subTotal: money(2000),
              discountTotal: money(500),
              feeTotal: money(0),
              taxTotal: money(200),
            },
            unitAmount: money(2000),
          }),
        ],
        shippingLines: [
          {
            id: 'shipping-line-1',
            requestedService: 'ground',
            requestedProvider: 'shippo',
            name: 'Ground',
            amount: money(1000),
            discounts: [],
          },
        ],
        totals: {
          subTotal: money(2000),
          discountTotal: money(500),
          shippingTotal: money(1000),
          taxTotal: money(200),
          feeTotal: money(0),
          total: money(2700),
        },
      },
      products: [productNode({ code: 'mug-sku', label: 'Coffee Mug' })],
      formDefaultValues: { tipAmount: 500 },
    });

    // subtotal $20.00 - discount $5.00 + shipping $10.00 + tax $2.00 = $27.00
    expect(requests.poyntExpressRequest.total.amount).toBe('27.00');
    expect(requests.poyntStandardRequest.total.amount).toBe('27.00');
    expect(requests.applePayRequest.total.amount).toBe('$27.00');
    expect(requests.squarePaymentRequest.amount).toBe('27.00');
  });

  it('excludes tipAmount from payment requests when enableTips is false', async () => {
    const { requests } = await renderUseBuildPaymentRequest({
      sessionOverrides: {
        enableTips: false,
      },
      draftOrderOverrides: {
        lineItems: [
          buildLineItem({
            name: 'Coffee Mug',
            quantity: 1,
            details: { sku: 'mug-sku' },
            totals: {
              subTotal: money(2000),
              discountTotal: money(0),
              feeTotal: money(0),
              taxTotal: money(0),
            },
            unitAmount: money(2000),
          }),
        ],
        shippingLines: [],
        totals: {
          subTotal: money(2000),
          discountTotal: money(0),
          shippingTotal: money(0),
          taxTotal: money(0),
          feeTotal: money(0),
          total: money(2000),
        },
      },
      products: [productNode({ code: 'mug-sku', label: 'Coffee Mug' })],
      formDefaultValues: { tipAmount: 500 },
    });

    // Totals should NOT include tip when enableTips is false
    expect(requests.applePayRequest.total.amount).toBe('$20.00');
    expect(requests.googlePayRequest.transactionInfo.totalPrice).toBe('$20.00');
    expect(requests.payPalRequest.purchase_units[0].amount.value).toBe('20.00');
    expect(requests.squarePaymentRequest.amount).toBe('20.00');
    expect(requests.poyntExpressRequest.total.amount).toBe('20.00');

    // No Tip line item in any request
    expect(requests.applePayRequest.lineItems).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Tip' })])
    );
    expect(requests.googlePayRequest.transactionInfo.displayItems).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Tip' })])
    );
    expect(requests.payPalRequest.purchase_units[0].items).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Tip' })])
    );
    expect(requests.poyntStandardRequest.lineItems).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Tip' })])
    );
    expect(requests.poyntExpressRequest.lineItems).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Tip' })])
    );
  });

  it.each([
    { scenario: 'the tip is explicitly zero', tipAmount: 0 },
    { scenario: 'no tip has been selected yet', tipAmount: undefined },
  ])(
    'omits the Tip line item when enableTips is true and $scenario',
    async ({ tipAmount }) => {
      const { requests } = await renderUseBuildPaymentRequest({
        sessionOverrides: {
          enableTips: true,
        },
        draftOrderOverrides: {
          lineItems: [
            buildLineItem({
              name: 'Coffee Mug',
              quantity: 1,
              details: { sku: 'mug-sku' },
              totals: {
                subTotal: money(2000),
                discountTotal: money(0),
                feeTotal: money(0),
                taxTotal: money(0),
              },
              unitAmount: money(2000),
            }),
          ],
          shippingLines: [],
          totals: {
            subTotal: money(2000),
            discountTotal: money(0),
            shippingTotal: money(0),
            taxTotal: money(0),
            feeTotal: money(0),
            total: money(2000),
          },
        },
        products: [productNode({ code: 'mug-sku', label: 'Coffee Mug' })],
        formDefaultValues: { tipAmount },
      });

      // A zero tip must not reach the wallet sheets as a "$0.00 Tip" row.
      expect(requests.applePayRequest.lineItems).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ label: 'Tip' })])
      );
      expect(
        requests.googlePayRequest.transactionInfo.displayItems
      ).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ label: 'Tip' })])
      );
      expect(requests.payPalRequest.purchase_units[0].items).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Tip' })])
      );
      expect(requests.poyntStandardRequest.lineItems).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ label: 'Tip' })])
      );
      expect(requests.poyntExpressRequest.lineItems).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ label: 'Tip' })])
      );

      expect(requests.applePayRequest.total.amount).toBe('$20.00');
      expect(requests.poyntExpressRequest.total.amount).toBe('20.00');
    }
  );
});
