import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { enUs } from '@godaddy/localizations';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import {
  clearOperations,
  flushPromises,
  getOperations,
  renderCheckout,
  setApiError,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';

async function applyCoupon(
  user: ReturnType<typeof import('@testing-library/user-event').default.setup>,
  code: string
) {
  let input: HTMLInputElement | undefined;
  let button: HTMLButtonElement | undefined;

  await waitFor(() => {
    const inputs = screen.getAllByPlaceholderText(
      /coupon code/i
    ) as HTMLInputElement[];
    const buttons = screen.getAllByRole('button', {
      name: /apply/i,
    }) as HTMLButtonElement[];
    const index = inputs.findIndex(candidate => !candidate.disabled);
    expect(index).toBeGreaterThanOrEqual(0);
    input = inputs[index];
    button = buttons[index];
  });

  await user.clear(input as HTMLInputElement);
  await user.type(input as HTMLInputElement, code);
  await waitFor(() => {
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
  await user.click(button as HTMLButtonElement);
}

describe('Checkout discounts', () => {
  it('renders a line-item discount code as a removable tag', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
      draftOrderOverrides: {
        lineItems: [
          {
            id: 'line-item-1',
            discounts: [{ code: 'lineitem10' }],
          },
        ],
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const lineItemTags = await screen.findAllByRole('button', {
      name: /remove lineitem10/i,
    });
    expect(lineItemTags.length).toBeGreaterThan(0);

    await user.click(lineItemTags.at(-1) as HTMLButtonElement);
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: [],
    });
  });

  it('renders a shipping-line discount code as a removable tag', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
      draftOrderOverrides: {
        shippingLines: [
          {
            requestedService: 'free-shipping',
            requestedProvider: 'unknown',
            name: 'Free Shipping',
            amount: { value: 0, currencyCode: 'USD' },
            discounts: [{ code: 'shipfree' }],
          },
        ],
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const shippingTags = await screen.findAllByRole('button', {
      name: /remove shipfree/i,
    });
    expect(shippingTags.length).toBeGreaterThan(0);

    await user.click(shippingTags.at(-1) as HTMLButtonElement);
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: [],
    });
  });

  it('applies and removes a coupon, recalculating taxes when enabled', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'onedollar');
    await waitForOperation('ApplyCheckoutSessionDiscount');
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: ['onedollar'],
    });
    expect(screen.getAllByText('onedollar')).toHaveLength(2);

    clearOperations();
    await user.click(
      screen
        .getAllByRole('button', { name: /remove onedollar/i })
        .at(-1) as HTMLButtonElement
    );
    await waitForOperation('ApplyCheckoutSessionDiscount');
    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: [],
    });
  });

  it('does not recalculate taxes on coupon apply when tax is disabled', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableTaxCollection: false },
    });
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'onedollar');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(0);
  });

  it('shows duplicate coupon validation without issuing a duplicate mutation', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: { discounts: [{ code: 'onedollar' }] },
    });
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'onedollar');

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/already been applied/i);
    });
    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(0);
  });

  it('hides coupon UI when promotions are disabled', async () => {
    renderCheckout({ sessionOverrides: { enablePromotionCodes: false } });
    await waitForCheckoutReady();
    expect(
      screen.queryByPlaceholderText(/coupon code/i)
    ).not.toBeInTheDocument();
  });

  it('renders the API error code inline when discount apply fails', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    setApiError(
      'applyDiscount',
      new GraphQLErrorWithCodes([
        { message: 'Bad code', code: 'DISCOUNT_NOT_FOUND' },
      ])
    );

    await applyCoupon(user, 'badcode');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/DISCOUNT_NOT_FOUND/i);
    });
    await flushPromises();
  });

  it('renders the localized generic message when discount apply fails without GraphQL codes', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    setApiError('applyDiscount', new Error('network unavailable'));

    await applyCoupon(user, 'badcode');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.discounts.failedToApply);
    });
    await flushPromises();
  });

  it('keeps empty coupon apply disabled and does not call the API', async () => {
    // TODO(T-1401): Product copy requests click-to-validate empty input, but
    // current UI disables Apply while the trimmed discount code is empty.
    renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const button = screen.getAllByRole('button', { name: /apply/i })[0];
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(0);
    expect(document.body).not.toHaveTextContent(
      enUs.discounts.enterCodeValidation
    );
  });

  it('does not submit an empty coupon with the Enter key', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const input = screen.getAllByPlaceholderText(/coupon code/i)[0];
    await user.click(input);
    await user.keyboard('{Enter}');
    await flushPromises();

    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(0);
    expect(document.body).not.toHaveTextContent(
      enUs.discounts.enterCodeValidation
    );
  });

  it('recalculates taxes when a coupon is removed', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: { discounts: [{ code: 'onedollar' }] },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(
      screen
        .getAllByRole('button', { name: /remove onedollar/i })
        .at(-1) as HTMLButtonElement
    );
    await waitForOperation('ApplyCheckoutSessionDiscount');
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(
      getOperations('CalculateCheckoutSessionTaxes').length
    ).toBeGreaterThan(0);
  });
});
