import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { eventIds } from '@/tracking/events';
import {
  clearOperations,
  mockTrack,
  renderCheckout,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastConfirmInput } from './checkout-test-fixtures';

vi.mock('@/tracking/track', async importOriginal => {
  const actual = await importOriginal<typeof import('@/tracking/track')>();
  return { ...actual, track: vi.fn() };
});

const tracking = mockTrack();

async function applyCoupon(
  user: ReturnType<typeof import('@testing-library/user-event').default.setup>,
  code: string
) {
  let input: HTMLInputElement | undefined;
  let apply: HTMLButtonElement | undefined;

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
    apply = buttons[index];
  });

  await user.clear(input as HTMLInputElement);
  await user.type(input as HTMLInputElement, code);
  await waitFor(() => {
    expect(apply as HTMLButtonElement).not.toBeDisabled();
  });
  await user.click(apply as HTMLButtonElement);
}

describe('Checkout tips', () => {
  it('does not render the tips section when enableTips is false', async () => {
    renderCheckout({ sessionOverrides: { enableTips: false } });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('button', { name: /15%/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /no tip/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /custom amount/i })
    ).not.toBeInTheDocument();
  });

  it('renders the percentage buttons, "No tip" and "Custom amount" when enableTips is true', async () => {
    renderCheckout({ sessionOverrides: { enableTips: true } });
    await waitForCheckoutReady();

    expect(await screen.findByRole('button', { name: /15%/ })).toBeVisible();
    expect(await screen.findByRole('button', { name: /18%/ })).toBeVisible();
    expect(await screen.findByRole('button', { name: /20%/ })).toBeVisible();
    expect(
      await screen.findByRole('button', { name: /no tip/i })
    ).toBeVisible();
    expect(
      await screen.findByRole('button', { name: /custom amount/i })
    ).toBeVisible();
  });

  it('marks the percentage button as aria-checked when clicked', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableTips: true },
    });
    await waitForCheckoutReady();

    const fifteen = await screen.findByRole('button', { name: /15%/ });
    expect(fifteen).toHaveAttribute('aria-checked', 'false');

    await user.click(fifteen);

    await waitFor(() => {
      expect(fifteen).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('percentage and no-tip choices update the order summary total due', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();

    expect(document.body).toHaveTextContent(/total due/i);
    expect(screen.getAllByText('$25.00').length).toBeGreaterThan(0);

    await user.click(await screen.findByRole('button', { name: /20%/ }));

    await waitFor(() => {
      expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
      expect(document.body).toHaveTextContent(/tip/i);
      expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
    });

    await user.click(await screen.findByRole('button', { name: /no tip/i }));

    await waitFor(() => {
      expect(screen.getAllByText('$25.00').length).toBeGreaterThan(0);
      expect(screen.queryByText('$30.00')).not.toBeInTheDocument();
    });
  });

  it('shows the custom tip input only after clicking "Custom amount"', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();

    // No custom-tip input visible initially.
    expect(
      document.querySelector('input[name="tipAmount"]')
    ).not.toBeInTheDocument();

    const customBtn = await screen.findByRole('button', {
      name: /custom amount/i,
    });
    await user.click(customBtn);

    await waitFor(() => {
      expect(customBtn).toHaveAttribute('aria-checked', 'true');
    });
    expect(await screen.findByPlaceholderText('0.00')).toBeVisible();
  });

  it('sanitizes and formats custom tips in major units', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();

    await user.click(
      await screen.findByRole('button', { name: /custom amount/i })
    );
    const input = screen.getByPlaceholderText('0.00');
    await user.click(input);
    await user.type(input, 'abc10.5x9');

    expect(input).toHaveValue('10.59');

    await user.tab();

    await waitFor(() => {
      expect(input).toHaveValue('10.59');
      expect(screen.getAllByText('$10.59').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$35.59').length).toBeGreaterThan(0);
    });
  });

  it('keeps a percentage tip snapshot after a coupon changes the order total', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
        enablePromotionCodes: true,
      },
      draftOrderOverrides: {
        totals: {
          subTotal: { value: 2500, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          shippingTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 2500, currencyCode: 'USD' },
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();
    tracking.clearTrackedEvents();

    await user.click(await screen.findByRole('button', { name: /20%/ }));
    await waitFor(() => {
      expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
    });
    tracking.expectTracked(eventIds.selectTipAmount, {
      tipPercentage: 20,
      tipAmount: 500,
      totalBeforeTip: 2500,
    });

    await applyCoupon(user, 'onedollar');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    await waitFor(() => {
      expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$29.00').length).toBeGreaterThan(0);
    });
  });

  it('documents current custom tip sanitization for negative and NaN input', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();

    await user.click(
      await screen.findByRole('button', { name: /custom amount/i })
    );
    const input = screen.getByPlaceholderText('0.00');

    await user.click(input);
    await user.type(input, '-5');
    expect(input).toHaveValue('5');
    await user.tab();
    await waitFor(() => {
      expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
    });

    await user.click(input);
    await user.clear(input);
    await user.type(input, 'NaN');
    expect(input).toHaveValue('');
    await user.tab();
    await waitFor(() => {
      expect(screen.queryByText('$30.00')).not.toBeInTheDocument();
      expect(screen.getAllByText('$25.00').length).toBeGreaterThan(0);
    });
  });

  it('converts KWD custom tips with 3-decimal precision to minor units', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
      draftOrderOverrides: {
        totals: {
          subTotal: { value: 25000, currencyCode: 'KWD' },
          discountTotal: { value: 0, currencyCode: 'KWD' },
          shippingTotal: { value: 0, currencyCode: 'KWD' },
          taxTotal: { value: 0, currencyCode: 'KWD' },
          feeTotal: { value: 0, currencyCode: 'KWD' },
          total: { value: 25000, currencyCode: 'KWD' },
        },
      },
    });
    await waitForCheckoutReady();
    tracking.clearTrackedEvents();

    await user.click(
      await screen.findByRole('button', { name: /custom amount/i })
    );
    const input = await screen.findByPlaceholderText('0.000');
    await user.click(input);
    await user.type(input, '1.234');
    await user.tab();

    await waitFor(() => {
      expect(input).toHaveValue('1.234');
      expect(document.body).toHaveTextContent(
        /KWD\s*1\.234|1\.234\s*KWD|د\.ك\s*1\.234/
      );
      expect(document.body).toHaveTextContent(
        /KWD\s*26\.234|26\.234\s*KWD|د\.ك\s*26\.234/
      );
    });
    tracking.expectTracked(eventIds.enterCustomTip, {
      tipAmount: 1234,
      totalBeforeTip: 25000,
      tipPercentage: 4.94,
      currencyCode: 'KWD',
    });
  });

  it('converts zero-decimal custom tips and switches back to percentage cleanly', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
      draftOrderOverrides: {
        totals: {
          subTotal: { value: 2500, currencyCode: 'JPY' },
          discountTotal: { value: 0, currencyCode: 'JPY' },
          shippingTotal: { value: 0, currencyCode: 'JPY' },
          taxTotal: { value: 0, currencyCode: 'JPY' },
          feeTotal: { value: 0, currencyCode: 'JPY' },
          total: { value: 2500, currencyCode: 'JPY' },
        },
      },
    });
    await waitForCheckoutReady();

    await user.click(
      await screen.findByRole('button', { name: /custom amount/i })
    );
    const input = await screen.findByPlaceholderText('0');
    await user.click(input);
    await user.type(input, '12.34');
    expect(input).toHaveValue('1234');
    await user.tab();

    await waitFor(() => {
      expect(screen.getAllByText('¥1,234').length).toBeGreaterThan(0);
    });

    const fifteen = await screen.findByRole('button', { name: /15%/ });
    await user.click(fifteen);

    await waitFor(() => {
      expect(fifteen).toHaveAttribute('aria-checked', 'true');
      expect(screen.queryByPlaceholderText('0')).not.toBeInTheDocument();
    });
  });

  it('includes tipAmount in the ConfirmCheckoutSession mutation payload', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
        paymentMethods: {
          card: {
            processor: 'godaddy',
            checkoutTypes: ['standard'],
          },
        },
      },
      draftOrderOverrides: {
        totals: {
          subTotal: { value: 2500, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          shippingTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 2500, currencyCode: 'USD' },
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(await screen.findByRole('button', { name: /20%/ }));
    await waitFor(() => {
      expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
    });

    await user.click(await screen.findByRole('button', { name: /pay now/i }));
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      tipAmount: 500,
    });
  });

  it('includes a custom tipAmount when entering a custom tip before confirming', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
        paymentMethods: {
          card: {
            processor: 'godaddy',
            checkoutTypes: ['standard'],
          },
        },
      },
      draftOrderOverrides: {
        totals: {
          subTotal: { value: 2500, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          shippingTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 2500, currencyCode: 'USD' },
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /custom amount/i })
    );
    const input = await screen.findByPlaceholderText('0.00');
    await user.click(input);
    await user.type(input, '7.50');
    await user.tab();

    await waitFor(() => {
      expect(screen.getAllByText('$7.50').length).toBeGreaterThan(0);
    });

    await user.click(await screen.findByRole('button', { name: /pay now/i }));
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      tipAmount: 750,
    });
  });

  it('sends tipAmount as 0 when no tip is selected', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
        paymentMethods: {
          card: {
            processor: 'godaddy',
            checkoutTypes: ['standard'],
          },
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(await screen.findByRole('button', { name: /pay now/i }));
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      tipAmount: 0,
    });
  });
});
