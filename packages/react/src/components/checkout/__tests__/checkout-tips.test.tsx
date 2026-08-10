import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { eventIds } from '@/tracking/events';
import {
  clearOperations,
  mockTrack,
  renderCheckout,
  setApiError,
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
      screen.queryByRole('radio', { name: /15%/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /no tip/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /custom amount/i })
    ).not.toBeInTheDocument();
  });

  it('renders the percentage buttons, "No tip" and "Custom amount" when enableTips is true', async () => {
    renderCheckout({ sessionOverrides: { enableTips: true } });
    await waitForCheckoutReady();

    expect(await screen.findByRole('radio', { name: /15%/ })).toBeVisible();
    expect(await screen.findByRole('radio', { name: /18%/ })).toBeVisible();
    expect(await screen.findByRole('radio', { name: /20%/ })).toBeVisible();
    expect(await screen.findByRole('radio', { name: /no tip/i })).toBeVisible();
    expect(
      await screen.findByRole('radio', { name: /custom amount/i })
    ).toBeVisible();
  });

  it('marks the percentage button as aria-checked when clicked', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableTips: true },
    });
    await waitForCheckoutReady();

    const fifteen = await screen.findByRole('radio', { name: /15%/ });
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

    await user.click(await screen.findByRole('radio', { name: /20%/ }));

    await waitFor(() => {
      expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
      expect(document.body).toHaveTextContent(/tip/i);
      expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
    });

    await user.click(await screen.findByRole('radio', { name: /no tip/i }));

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

    const customBtn = await screen.findByRole('radio', {
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
      await screen.findByRole('radio', { name: /custom amount/i })
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

    await user.click(await screen.findByRole('radio', { name: /20%/ }));
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
      await screen.findByRole('radio', { name: /custom amount/i })
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
      await screen.findByRole('radio', { name: /custom amount/i })
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
      await screen.findByRole('radio', { name: /custom amount/i })
    );
    const input = await screen.findByPlaceholderText('0');
    await user.click(input);
    await user.type(input, '12.34');
    expect(input).toHaveValue('1234');
    await user.tab();

    await waitFor(() => {
      expect(screen.getAllByText('¥1,234').length).toBeGreaterThan(0);
    });

    const fifteen = await screen.findByRole('radio', { name: /15%/ });
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

    await user.click(await screen.findByRole('radio', { name: /20%/ }));
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
      await screen.findByRole('radio', { name: /custom amount/i })
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

  it('omits tipAmount entirely from the confirm payload when tips are disabled', async () => {
    // Not just `tipAmount: undefined` — the key should not be in the request.
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: false,
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

    expect(getLastConfirmInput()).not.toHaveProperty('tipAmount');
  });

  describe('tip rejections from the API', () => {
    function tipsOnlySession() {
      return {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
        paymentMethods: {
          card: {
            processor: 'godaddy' as const,
            checkoutTypes: ['standard' as const],
          },
        },
      };
    }

    function rejectTipOnConfirm() {
      setApiError(
        'confirmCheckout',
        new GraphQLErrorWithCodes([
          {
            message:
              'Tip may not exceed 100% of the order total or 2000, whichever is greater',
            code: 'TIP_EXCEEDS_LIMIT',
            // The API tags its tip errors with the input path they belong to.
            path: ['tipAmount'],
          },
        ])
      );
    }

    it('surfaces TIP_EXCEEDS_LIMIT on the tip field, not only in the error list', async () => {
      const { user } = renderCheckout({
        sessionOverrides: tipsOnlySession(),
      });
      await waitForCheckoutReady();

      await user.click(await screen.findByRole('radio', { name: /18%/ }));
      clearOperations();
      rejectTipOnConfirm();

      await user.click(await screen.findByRole('button', { name: /pay now/i }));
      await waitForOperation('ConfirmCheckoutSession');

      // Once beside the tip presets, once in the checkout-wide error list —
      // which is what scrolls the failure into view.
      await waitFor(() => {
        expect(
          screen.getAllByText(/Tip is too large for this order/i)
        ).toHaveLength(2);
      });
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Tip is too large for this order/i
      );
    });

    it('clears the tip field error once a different tip is selected', async () => {
      const { user } = renderCheckout({
        sessionOverrides: tipsOnlySession(),
      });
      await waitForCheckoutReady();

      await user.click(await screen.findByRole('radio', { name: /18%/ }));
      clearOperations();
      rejectTipOnConfirm();

      await user.click(await screen.findByRole('button', { name: /pay now/i }));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // react-hook-form leaves manually-set errors in place, so the tip form has
      // to drop this one itself when the amount it described no longer applies.
      await user.click(await screen.findByRole('radio', { name: /no tip/i }));

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('options.thresholds', () => {
    it('uses default percentages when no thresholds match the subtotal', async () => {
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [10, 15, 20], amounts: null },
            thresholds: [
              {
                minSubtotal: 100000,
                maxSubtotal: 200000,
                percentages: [5, 8, 12],
                amounts: null,
              },
            ],
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

      expect(await screen.findByRole('radio', { name: /10%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /15%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /20%/ })).toBeVisible();
      expect(
        screen.queryByRole('radio', { name: /\b5%/ })
      ).not.toBeInTheDocument();
    });

    it('keeps the default presets when a matching threshold configures an empty list', async () => {
      // An empty array is not a configured option. Treating it as one used to
      // clear the default without replacing it, falling through to the
      // hardcoded 15/18/20 — so the percentages below deliberately avoid those.
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [7, 9, 11], amounts: null },
            thresholds: [
              {
                minSubtotal: 2000,
                maxSubtotal: 5000,
                percentages: null,
                amounts: [],
              },
            ],
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

      expect(await screen.findByRole('radio', { name: /7%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /9%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /11%/ })).toBeVisible();
      expect(
        screen.queryByRole('radio', { name: /18%/ })
      ).not.toBeInTheDocument();
    });

    it('uses threshold percentages when subtotal falls within a threshold range', async () => {
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [10, 15, 20], amounts: null },
            thresholds: [
              {
                minSubtotal: 2000,
                maxSubtotal: 5000,
                percentages: [5, 8, 12],
                amounts: null,
              },
            ],
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

      expect(await screen.findByRole('radio', { name: /5%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /8%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /12%/ })).toBeVisible();
      expect(
        screen.queryByRole('radio', { name: /10%/ })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('radio', { name: /15%/ })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('radio', { name: /20%/ })
      ).not.toBeInTheDocument();
    });

    it('uses threshold amounts (flat values) when a matching threshold specifies amounts', async () => {
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [10, 15, 20], amounts: null },
            thresholds: [
              {
                minSubtotal: 2000,
                maxSubtotal: 5000,
                amounts: [100, 200, 500],
                percentages: null,
              },
            ],
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

      expect(
        await screen.findByRole('radio', { name: /\$1\.00/ })
      ).toBeVisible();
      expect(
        await screen.findByRole('radio', { name: /\$2\.00/ })
      ).toBeVisible();
      expect(
        await screen.findByRole('radio', { name: /\$5\.00/ })
      ).toBeVisible();
      expect(
        screen.queryByRole('radio', { name: /10%/ })
      ).not.toBeInTheDocument();
    });

    it('threshold amounts take priority over threshold percentages when both are provided', async () => {
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [10, 15, 20], amounts: null },
            thresholds: [
              {
                minSubtotal: 2000,
                maxSubtotal: 5000,
                amounts: [100, 200, 500],
                percentages: [5, 8, 12],
              },
            ],
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

      expect(
        await screen.findByRole('radio', { name: /\$1\.00/ })
      ).toBeVisible();
      expect(
        await screen.findByRole('radio', { name: /\$2\.00/ })
      ).toBeVisible();
      expect(
        await screen.findByRole('radio', { name: /\$5\.00/ })
      ).toBeVisible();
      expect(
        screen.queryByRole('radio', { name: /5%/ })
      ).not.toBeInTheDocument();
    });

    it('matches the correct threshold when multiple thresholds are defined', async () => {
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [15, 18, 20], amounts: null },
            thresholds: [
              {
                minSubtotal: 1000,
                maxSubtotal: 3000,
                percentages: [5, 8, 10],
                amounts: null,
              },
              {
                minSubtotal: 3001,
                maxSubtotal: 10000,
                percentages: [3, 5, 7],
                amounts: null,
              },
            ],
          },
        },
        draftOrderOverrides: {
          totals: {
            subTotal: { value: 5000, currencyCode: 'USD' },
            discountTotal: { value: 0, currencyCode: 'USD' },
            shippingTotal: { value: 0, currencyCode: 'USD' },
            taxTotal: { value: 0, currencyCode: 'USD' },
            feeTotal: { value: 0, currencyCode: 'USD' },
            total: { value: 5000, currencyCode: 'USD' },
          },
        },
      });
      await waitForCheckoutReady();

      expect(await screen.findByRole('radio', { name: /3%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /5%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /7%/ })).toBeVisible();
      expect(
        screen.queryByRole('radio', { name: /15%/ })
      ).not.toBeInTheDocument();
    });

    it('applies threshold at boundary: subtotal equals minSubtotal', async () => {
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [15, 18, 20], amounts: null },
            thresholds: [
              {
                minSubtotal: 2500,
                maxSubtotal: 5000,
                percentages: [5, 8, 12],
                amounts: null,
              },
            ],
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

      expect(await screen.findByRole('radio', { name: /5%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /8%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /12%/ })).toBeVisible();
    });

    it('applies threshold at boundary: subtotal equals maxSubtotal', async () => {
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [15, 18, 20], amounts: null },
            thresholds: [
              {
                minSubtotal: 2000,
                maxSubtotal: 2500,
                percentages: [5, 8, 12],
                amounts: null,
              },
            ],
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

      expect(await screen.findByRole('radio', { name: /5%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /8%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /12%/ })).toBeVisible();
    });

    it('clicking a threshold amount button selects it and updates the total', async () => {
      const { user } = renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: null, amounts: null },
            thresholds: [
              {
                minSubtotal: 2000,
                maxSubtotal: 5000,
                amounts: [200, 500, 1000],
                percentages: null,
              },
            ],
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

      const fiveDollarBtn = await screen.findByRole('radio', {
        name: /\$5\.00/,
      });
      await user.click(fiveDollarBtn);

      await waitFor(() => {
        expect(fiveDollarBtn).toHaveAttribute('aria-checked', 'true');
        expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
      });
    });

    it('deselects a threshold amount button when switching to "Custom amount"', async () => {
      const { user } = renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: null, amounts: null },
            thresholds: [
              {
                minSubtotal: 2000,
                maxSubtotal: 5000,
                amounts: [200, 500, 1000],
                percentages: null,
              },
            ],
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

      const fiveDollarBtn = await screen.findByRole('radio', {
        name: /\$5\.00/,
      });
      await user.click(fiveDollarBtn);
      await waitFor(() => {
        expect(fiveDollarBtn).toHaveAttribute('aria-checked', 'true');
      });

      const customBtn = await screen.findByRole('radio', {
        name: /custom amount/i,
      });
      await user.click(customBtn);

      // The custom input carries the $5.00 over, but the preset must not stay
      // checked — a radiogroup can only have one checked option.
      await waitFor(() => {
        expect(customBtn).toHaveAttribute('aria-checked', 'true');
        expect(fiveDollarBtn).toHaveAttribute('aria-checked', 'false');
      });

      const checked = screen
        .getAllByRole('radiogroup')
        .flatMap(group =>
          Array.from(group.querySelectorAll('[aria-checked="true"]'))
        );
      expect(checked).toEqual([customBtn]);

      // Selecting the preset again re-checks it and clears the custom input.
      await user.click(fiveDollarBtn);
      await waitFor(() => {
        expect(fiveDollarBtn).toHaveAttribute('aria-checked', 'true');
        expect(customBtn).toHaveAttribute('aria-checked', 'false');
      });
    });

    it('uses default amounts when options.default.amounts is provided and no threshold matches', async () => {
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: null, amounts: [100, 300, 500] },
            thresholds: [
              {
                minSubtotal: 100000,
                maxSubtotal: 200000,
                percentages: [1, 2, 3],
                amounts: null,
              },
            ],
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

      expect(
        await screen.findByRole('radio', { name: /\$1\.00/ })
      ).toBeVisible();
      expect(
        await screen.findByRole('radio', { name: /\$3\.00/ })
      ).toBeVisible();
      expect(
        await screen.findByRole('radio', { name: /\$5\.00/ })
      ).toBeVisible();
      expect(
        screen.queryByRole('radio', { name: /15%/ })
      ).not.toBeInTheDocument();
    });

    it('falls back to DEFAULT_TIP_PERCENTAGES when no options are provided', async () => {
      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: null,
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

      expect(await screen.findByRole('radio', { name: /15%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /18%/ })).toBeVisible();
      expect(await screen.findByRole('radio', { name: /20%/ })).toBeVisible();
    });

    it('warns in development when several thresholds match the subtotal', async () => {
      // Overlapping ranges make the array order load-bearing, which nothing
      // else surfaces — the first match just wins.
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [15, 18, 20], amounts: null },
            thresholds: [
              {
                minSubtotal: 1000,
                maxSubtotal: 5000,
                percentages: [5, 8, 10],
                amounts: null,
              },
              {
                minSubtotal: 2000,
                maxSubtotal: 6000,
                percentages: [3, 5, 7],
                amounts: null,
              },
            ],
          },
        },
      });
      await waitForCheckoutReady();

      // The first match still wins, so behavior is unchanged.
      expect(await screen.findByRole('radio', { name: /10%/ })).toBeVisible();
      await waitFor(() => {
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining('tips.thresholds has 2 entries matching')
        );
      });
    });

    it('does not warn when a single threshold matches', async () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: [15, 18, 20], amounts: null },
            thresholds: [
              {
                minSubtotal: 1000,
                maxSubtotal: 5000,
                percentages: [5, 8, 10],
                amounts: null,
              },
            ],
          },
        },
      });
      await waitForCheckoutReady();

      expect(await screen.findByRole('radio', { name: /10%/ })).toBeVisible();
      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('tips.thresholds')
      );
    });
  });

  describe('duplicate presets', () => {
    function renderDuplicateAmounts() {
      return renderCheckout({
        sessionOverrides: {
          enableTips: true,
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
          tips: {
            default: { percentages: null, amounts: [500, 500, 700] },
            thresholds: null,
          },
          // The GoDaddy card button confirms through `useConfirmCheckout`, which
          // is what puts the tip on the payload.
          paymentMethods: {
            card: {
              processor: 'godaddy',
              checkoutTypes: ['standard'],
            },
          },
        },
      });
    }

    it('checks only the preset that was clicked', async () => {
      const { user } = renderDuplicateAmounts();
      await waitForCheckoutReady();

      const fiveDollarPresets = await screen.findAllByRole('radio', {
        name: /\$5\.00/,
      });
      expect(fiveDollarPresets).toHaveLength(2);

      await user.click(fiveDollarPresets[1]);

      await waitFor(() => {
        expect(fiveDollarPresets[1]).toHaveAttribute('aria-checked', 'true');
      });
      // Matching by value alone would report both as selected.
      expect(fiveDollarPresets[0]).toHaveAttribute('aria-checked', 'false');
    });

    it('still applies the tip the duplicate preset is worth', async () => {
      const { user } = renderDuplicateAmounts();
      await waitForCheckoutReady();
      clearOperations();

      const fiveDollarPresets = await screen.findAllByRole('radio', {
        name: /\$5\.00/,
      });
      await user.click(fiveDollarPresets[1]);

      await user.click(await screen.findByRole('button', { name: /pay now/i }));
      await waitForOperation('ConfirmCheckoutSession');

      expect(getLastConfirmInput()).toMatchObject({ tipAmount: 500 });
    });
  });
});
