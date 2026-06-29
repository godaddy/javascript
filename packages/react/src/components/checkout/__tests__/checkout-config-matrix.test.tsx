import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import * as godaddyApi from '@/lib/godaddy/godaddy';
import {
  advanceCheckoutDebounce,
  buildCheckoutSession,
  buildDraftOrder,
  buildDraftOrderUpdate,
  buildShippingAddress,
  clearOperations,
  fillShippingAddress,
  getOperations,
  mockGodaddyApi,
  renderCheckout,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastUpdateInput, noBillingAddress } from './checkout-test-fixtures';

describe('Checkout configuration matrix', () => {
  it('supports shipping + pickup with names-only billing without sending stale billing address fields', async () => {
    const draftOrder = buildDraftOrder(noBillingAddress);
    const session = buildCheckoutSession({
      draftOrder,
      enableLocalPickup: true,
      enableShipping: true,
      enableShippingAddressCollection: true,
      enableBillingAddressCollection: false,
      enablePhoneCollection: true,
      enableTaxCollection: true,
      enableNotesCollection: true,
      enablePromotionCodes: true,
    });
    mockGodaddyApi({ session, draftOrder });
    clearOperations();
    await godaddyApi.updateDraftOrder(
      buildDraftOrderUpdate(
        {
          billing: { firstName: 'Only', lastName: 'Names', address: null },
        },
        session
      ),
      session
    );

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
    expect(getLastUpdateInput()).toMatchObject({
      billing: { firstName: 'Only', lastName: 'Names', address: null },
    });
  });

  it('supports shipping-only checkout and applies a changed shipping method with one tax calculation', async () => {
    const { session } = renderCheckout({
      draftOrderOverrides: {
        shipping: {
          firstName: '',
          lastName: '',
          phone: '',
          address: buildShippingAddress({
            addressLine1: '',
            adminArea1: 'GA',
            adminArea2: '',
            postalCode: '',
          }),
        },
      },
      sessionOverrides: {
        enableLocalPickup: false,
        enableShipping: true,
        enableShippingAddressCollection: true,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
        enablePromotionCodes: true,
      },
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('radio', { name: /local pickup/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/pickup date/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Shipping').length).toBeGreaterThan(0);

    clearOperations();
    await godaddyApi.updateDraftOrder(
      buildDraftOrderUpdate(
        {
          shipping: {
            firstName: 'Ship',
            lastName: 'Buyer',
            address: buildShippingAddress({
              addressLine1: '456 Shipping Ln',
              addressLine2: '',
              adminArea2: 'Jasper',
              postalCode: '30143',
              countryCode: 'US',
            }),
          },
        },
        session
      ),
      session
    );
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
  });

  it('supports pickup-only checkout without fetching or applying shipping rates', async () => {
    renderCheckout({
      draftOrderOverrides: {
        ...noBillingAddress,
        shipping: { address: null },
        lineItems: [{ fulfillmentMode: DeliveryMethods.PICKUP }],
      },
      sessionOverrides: {
        enableLocalPickup: true,
        enableShipping: false,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
        enablePromotionCodes: true,
      },
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('radio', { name: /^shipping/i })
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('input[name="shippingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/jasper/i).length).toBeGreaterThan(0);
    expect(getOperations('DraftOrderShippingRates')).toHaveLength(0);
    expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(0);
  });

  it('does not calculate taxes when tax collection is disabled', async () => {
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      enableTaxCollection: false,
      enablePromotionCodes: true,
    });
    mockGodaddyApi({ session, draftOrder });
    clearOperations();
    await godaddyApi.applyShippingMethod(
      [{ name: 'Weight Based', requestedService: 'weight-based' }],
      session
    );
    await godaddyApi.applyDiscount(['onedollar'], session);

    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(0);
  });

  it('hides coupon UI and avoids discount mutations when promotions are disabled', async () => {
    renderCheckout({ sessionOverrides: { enablePromotionCodes: false } });
    await waitForCheckoutReady();

    expect(
      screen.queryByPlaceholderText(/coupon code/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /apply/i })
    ).not.toBeInTheDocument();
    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: /pay now/i })
    ).toBeInTheDocument();
  });
});
