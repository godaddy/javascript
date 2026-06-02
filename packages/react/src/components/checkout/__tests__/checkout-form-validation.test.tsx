import { enUs } from '@godaddy/localizations';
import { screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { PaymentMethodType, PaymentProvider } from '@/types';
import {
  buildDraftOrder,
  buildLineItem,
  buildShippingAddress,
  clearOperations,
  getOperations,
  renderCheckout,
  typeIntoNamedField,
  waitForCheckoutReady,
} from './checkout-test-env';

vi.mock('@/components/checkout/address', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/components/checkout/address')>();
  return {
    ...actual,
    hasRegionData: (countryCode: string) =>
      countryCode === 'IE' ? false : actual.hasRegionData(countryCode),
  };
});

const DeliveryMethods = {
  NONE: 'NONE',
  PICKUP: 'PICKUP',
  SHIP: 'SHIP',
} as const;

function _offlinePaymentMethods() {
  return {
    card: null as never,
    ach: null,
    express: null,
    paypal: null,
    applePay: null,
    googlePay: null,
    paze: null,
    mercadopago: null,
    ccavenue: null,
    offline: {
      type: PaymentMethodType.OFFLINE,
      processor: PaymentProvider.OFFLINE,
      checkoutTypes: ['standard'],
    },
  };
}

function stripeOnlyPaymentMethods() {
  return {
    card: {
      type: PaymentMethodType.CREDIT_CARD,
      processor: PaymentProvider.STRIPE,
      checkoutTypes: ['standard'],
    },
    ach: null,
    express: null,
    paypal: null,
    applePay: null,
    googlePay: null,
    paze: null,
    mercadopago: null,
    ccavenue: null,
    offline: null,
  };
}

function freeTotals() {
  return {
    subTotal: { value: 0, currencyCode: 'USD' },
    discountTotal: { value: 0, currencyCode: 'USD' },
    shippingTotal: { value: 0, currencyCode: 'USD' },
    taxTotal: { value: 0, currencyCode: 'USD' },
    feeTotal: { value: 0, currencyCode: 'USD' },
    total: { value: 0, currencyCode: 'USD' },
  };
}

function makeFreePickupOrder(overrides = {}) {
  return buildDraftOrder({
    totals: freeTotals(),
    lineItems: [
      buildLineItem({
        fulfillmentMode: DeliveryMethods.PICKUP,
        unitAmount: { value: 0, currencyCode: 'USD' },
        totals: {
          subTotal: { value: 0, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
        },
      }),
    ],
    billing: {
      firstName: '',
      lastName: 'Pickup',
      address: buildShippingAddress({ addressLine1: '' }),
    },
    ...overrides,
  });
}

function makePaidPickupOrder(overrides = {}) {
  return buildDraftOrder({
    lineItems: [buildLineItem({ fulfillmentMode: DeliveryMethods.PICKUP })],
    billing: {
      firstName: 'Pat',
      lastName: 'Pickup',
      address: buildShippingAddress({ addressLine1: '' }),
    },
    ...overrides,
  });
}

async function clickSubmitButton(name: RegExp) {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => expect(button).not.toBeDisabled());
  return button;
}

function BillingReuseProbe() {
  const form = useFormContext();

  return (
    <button
      type='button'
      onClick={() => {
        form.setValue('paymentUseShippingAddress', false, {
          shouldDirty: true,
        });
      }}
    >
      Toggle billing reuse off
    </button>
  );
}

describe('Checkout form validation', () => {
  it('requires only billing names for free pickup and does not require billing address fields', async () => {
    const draftOrder = makeFreePickupOrder();
    const { user } = renderCheckout({
      draftOrder,
      sessionOverrides: {
        draftOrder,
        paymentMethods: stripeOnlyPaymentMethods(),
        enableShipping: false,
        enableLocalPickup: true,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(await clickSubmitButton(/complete your free order/i));

    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.validation.enterFirstName);
    });
    expect(document.body).not.toHaveTextContent(enUs.validation.enterAddress);
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });

  it('pins current paid pickup card behavior when the billing address line is empty', async () => {
    const draftOrder = makePaidPickupOrder();
    const { user } = renderCheckout({
      draftOrder,
      sessionOverrides: {
        draftOrder,
        paymentMethods: stripeOnlyPaymentMethods(),
        enableShipping: false,
        enableLocalPickup: true,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(await clickSubmitButton(/pay now/i));

    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.validation.enterAddress);
    });
    expect(getOperations('TokenizeJs.getNonce')).toHaveLength(0);
  });

  it('ignores empty billing fields when shipping address is reused and blocks on empty shipping fields', async () => {
    const draftOrder = buildDraftOrder({
      shipping: {
        firstName: '',
        lastName: '',
        phone: '',
        address: buildShippingAddress({
          addressLine1: '',
          adminArea1: '',
          adminArea2: '',
          postalCode: '',
          countryCode: 'US',
        }),
      },
      billing: {
        firstName: 'Ship',
        lastName: 'Buyer',
        address: buildShippingAddress(),
      },
    });
    const { user } = renderCheckout({
      draftOrder,
      sessionOverrides: {
        draftOrder,
        paymentMethods: stripeOnlyPaymentMethods(),
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(await clickSubmitButton(/pay now/i));

    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.validation.enterFirstName);
      expect(document.body).toHaveTextContent(enUs.validation.enterAddress);
      expect(document.body).toHaveTextContent(enUs.validation.enterCity);
      expect(document.body).toHaveTextContent(
        enUs.validation.enterZipPostalCode
      );
      expect(document.body).toHaveTextContent(enUs.validation.selectState);
    });
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).toBeNull();
    expect(getOperations('TokenizeJs.getNonce')).toHaveLength(0);
  });

  it('pins current card behavior after shipping address reuse is toggled off', async () => {
    const draftOrder = buildDraftOrder({
      shipping: {
        firstName: 'Ship',
        lastName: 'Buyer',
        address: buildShippingAddress({
          adminArea1: '',
          countryCode: 'IE',
        }),
      },
      billing: {
        firstName: '',
        lastName: '',
        phone: '',
        address: buildShippingAddress({
          addressLine1: '',
          adminArea1: '',
          adminArea2: '',
          postalCode: '',
          countryCode: 'IE',
        }),
      },
    });
    const { user } = renderCheckout({
      draftOrder,
      sessionOverrides: {
        draftOrder,
        enableLocalPickup: false,
        enableBillingAddressCollection: false,
        paymentMethods: {
          ...stripeOnlyPaymentMethods(),
          card: null as never,
          offline: {
            type: PaymentMethodType.OFFLINE,
            processor: PaymentProvider.OFFLINE,
            checkoutTypes: ['standard'],
          },
        },
      },
      checkoutProps: {
        targets: {
          'checkout.form.payment.after': BillingReuseProbe,
        },
      },
    });
    await waitForCheckoutReady();

    await user.click(
      screen.getByRole('button', { name: /toggle billing reuse off/i })
    );
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(enUs.validation.enterAddress);
  });

  it('pins current purchase-only card behavior with empty billing fields', async () => {
    const draftOrder = buildDraftOrder({
      lineItems: [buildLineItem({ fulfillmentMode: DeliveryMethods.NONE })],
      shipping: {
        firstName: '',
        lastName: '',
        phone: '',
        address: buildShippingAddress({
          addressLine1: '',
          adminArea1: '',
          adminArea2: '',
          postalCode: '',
        }),
      },
      billing: {
        firstName: '',
        lastName: '',
        phone: '',
        address: buildShippingAddress({
          addressLine1: '',
          adminArea1: '',
          adminArea2: '',
          postalCode: '',
          countryCode: 'US',
        }),
      },
    });
    const { user } = renderCheckout({
      draftOrder,
      sessionOverrides: {
        draftOrder,
        paymentMethods: stripeOnlyPaymentMethods(),
        enableShipping: false,
        enableLocalPickup: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(await clickSubmitButton(/pay now/i));

    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.validation.enterFirstName);
      expect(document.body).toHaveTextContent(enUs.validation.enterLastName);
      expect(document.body).toHaveTextContent(enUs.validation.enterAddress);
      expect(document.body).toHaveTextContent(enUs.validation.enterCity);
      expect(document.body).toHaveTextContent(
        enUs.validation.enterZipPostalCode
      );
      expect(document.body).toHaveTextContent(enUs.validation.selectState);
    });
    expect(
      document.querySelector('input[name="shippingAddressLine1"]')
    ).toBeNull();
    expect(getOperations('TokenizeJs.getNonce')).toHaveLength(0);
  });

  it('toggles state validation from country region data', async () => {
    const draftOrder = buildDraftOrder({
      shipping: {
        firstName: 'Ship',
        lastName: 'Buyer',
        phone: '',
        address: buildShippingAddress({
          addressLine1: '1 Long Lane',
          adminArea1: '',
          adminArea2: 'Dublin',
          postalCode: 'D02 X285',
          countryCode: 'IE',
        }),
      },
      billing: {
        firstName: 'Ship',
        lastName: 'Buyer',
        phone: '',
        address: buildShippingAddress({
          addressLine1: '1 Long Lane',
          adminArea1: '',
          adminArea2: 'Dublin',
          postalCode: 'D02 X285',
          countryCode: 'IE',
        }),
      },
    });
    const { user } = renderCheckout({
      draftOrder,
      sessionOverrides: {
        draftOrder,
        paymentMethods: stripeOnlyPaymentMethods(),
      },
    });
    await waitForCheckoutReady();

    await user.click(await clickSubmitButton(/pay now/i));

    await waitFor(() => {
      expect(
        screen.queryByText(enUs.validation.selectState)
      ).not.toBeInTheDocument();
    });

    const countryButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        'button[aria-haspopup="dialog"]'
      )
    );
    const irelandButton = countryButtons.find(button =>
      /ireland/i.test(button.textContent ?? '')
    );
    expect(irelandButton).toBeTruthy();
    await user.click(irelandButton as HTMLButtonElement);
    await user.click(
      await screen.findByRole('option', { name: /^united states$/i })
    );
    clearOperations();
    await user.click(await clickSubmitButton(/pay now/i));

    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.validation.selectState);
    });
    expect(getOperations('TokenizeJs.getNonce')).toHaveLength(0);
  });
});
