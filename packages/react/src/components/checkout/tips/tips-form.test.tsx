import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps, useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { checkoutContext } from '@/components/checkout/checkout';
import { TipsForm } from '@/components/checkout/tips/tips-form';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  buildCheckoutSession,
  createTestQueryClient,
} from '../__tests__/checkout-test-env';

type TipsOptions = ComponentProps<typeof TipsForm>['options'];

/**
 * The subtotal is owned by the harness rather than by a fixture, because these
 * tests are about what happens to a selection when the subtotal moves under it —
 * routine, since the tips section renders before the draft-order totals resolve.
 */
function Harness({
  initialSubtotal,
  nextSubtotal,
  initialOrderTotal,
  nextOrderTotal,
  options,
  isTotalsLoading = false,
}: {
  initialSubtotal: number;
  nextSubtotal: number;
  /** Defaults to the subtotal, an order with nothing discounted or added. */
  initialOrderTotal?: number;
  nextOrderTotal?: number;
  options?: TipsOptions;
  /** The draft order landing is what moves the subtotal, so it ends the load. */
  isTotalsLoading?: boolean;
}) {
  const [subtotal, setSubtotal] = useState(initialSubtotal);
  const [orderTotal, setOrderTotal] = useState(
    initialOrderTotal ?? initialSubtotal
  );
  const [totalsLoading, setTotalsLoading] = useState(isTotalsLoading);
  const form = useForm({ defaultValues: { tipAmount: 0 } });

  return (
    <checkoutContext.Provider
      value={{
        session: buildCheckoutSession({ enableTips: true }),
        isConfirmingCheckout: false,
        setIsConfirmingCheckout: () => undefined,
        checkoutErrors: undefined,
        setCheckoutErrors: () => undefined,
      }}
    >
      <FormProvider {...form}>
        <TipsForm
          subtotal={subtotal}
          orderTotal={orderTotal}
          options={options}
          currencyCode='USD'
          isTotalsLoading={totalsLoading}
        />
        <button
          type='button'
          data-testid='move-subtotal'
          onClick={() => {
            setSubtotal(nextSubtotal);
            setOrderTotal(nextOrderTotal ?? nextSubtotal);
            setTotalsLoading(false);
          }}
        >
          move subtotal
        </button>
        <TipState />
      </FormProvider>
    </checkoutContext.Provider>
  );
}

/** Exposes the values that actually get charged. */
function TipState() {
  const form = useFormContext();
  return (
    <>
      <div data-testid='tip-amount'>{String(form.watch('tipAmount'))}</div>
      <div data-testid='tip-percentage'>
        {String(form.watch('tipPercentage'))}
      </div>
    </>
  );
}

function renderTipsForm(props: ComponentProps<typeof Harness>) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <GoDaddyProvider queryClient={createTestQueryClient()}>
      <Harness {...props} />
    </GoDaddyProvider>
  );
  return { user };
}

describe('TipsForm when the subtotal moves under a selection', () => {
  it('re-derives what a percentage preset is worth', async () => {
    // The totals had not arrived when the customer picked a tip, so 20% of the
    // subtotal was 20% of nothing.
    const { user } = renderTipsForm({
      initialSubtotal: 0,
      nextSubtotal: 2500,
      isTotalsLoading: true,
    });

    await user.click(screen.getByRole('radio', { name: /20%/ }));
    expect(screen.getByTestId('tip-amount')).toHaveTextContent('0');

    await user.click(screen.getByTestId('move-subtotal'));

    // What the button reads is what gets charged.
    const preset = screen.getByRole('radio', { name: /20%/ });
    expect(preset).toHaveTextContent('$5.00');
    expect(preset).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('tip-amount')).toHaveTextContent('500');
  });

  it('leaves a fixed-amount preset alone', async () => {
    const { user } = renderTipsForm({
      initialSubtotal: 2500,
      nextSubtotal: 5000,
      options: {
        default: { amounts: [300, 500, 700], percentages: null },
        thresholds: null,
      },
    });

    await user.click(screen.getByRole('radio', { name: /\$5\.00/ }));
    expect(screen.getByTestId('tip-amount')).toHaveTextContent('500');

    await user.click(screen.getByTestId('move-subtotal'));

    // A fixed amount is not a proportion of anything, so it does not move.
    expect(screen.getByTestId('tip-amount')).toHaveTextContent('500');
    expect(screen.getByRole('radio', { name: /\$5\.00/ })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('keeps the selected percentage checked when a threshold swaps the presets', async () => {
    const { user } = renderTipsForm({
      initialSubtotal: 2500,
      nextSubtotal: 5000,
      options: {
        default: { percentages: [15, 18, 20], amounts: null },
        thresholds: [
          {
            minSubtotal: 5000,
            maxSubtotal: null,
            percentages: [20, 25, 30],
            amounts: null,
          },
        ],
      },
    });

    // 20% is the last preset before the threshold and the first one after it, so
    // the index the customer clicked no longer points at their choice.
    await user.click(screen.getByRole('radio', { name: /20%/ }));

    await user.click(screen.getByTestId('move-subtotal'));

    expect(screen.getByTestId('tip-percentage')).toHaveTextContent('20');
    expect(screen.getByRole('radio', { name: /20%/ })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('radio', { name: /25%/ })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    expect(screen.getByTestId('tip-amount')).toHaveTextContent('1000');
  });
});

describe('TipsForm presets on a zero subtotal', () => {
  it('drops the percentage presets and still offers a custom amount', async () => {
    // Every percentage of nothing is nothing, so the presets would be $0.00
    // buttons that leave the tip at zero when picked.
    const { user } = renderTipsForm({ initialSubtotal: 0, nextSubtotal: 0 });

    expect(
      screen.queryByRole('radio', { name: /15%/ })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /%/ })).not.toBeInTheDocument();

    // A tip is still possible, it just cannot be a proportion of the subtotal.
    await user.click(screen.getByRole('radio', { name: /custom amount/i }));
    const input = await screen.findByPlaceholderText('0.00');
    await user.type(input, '5');
    await user.tab();

    expect(screen.getByTestId('tip-amount')).toHaveTextContent('500');
  });

  it('keeps the percentage presets while the totals load', async () => {
    renderTipsForm({
      initialSubtotal: 0,
      nextSubtotal: 2500,
      isTotalsLoading: true,
    });

    // Hiding them here would flash them in once the draft order lands.
    expect(screen.getByRole('radio', { name: /15%/ })).toHaveTextContent(
      '$0.00'
    );
  });

  it('drops the percentage presets when the totals land on a zero subtotal', async () => {
    const { user } = renderTipsForm({
      initialSubtotal: 0,
      nextSubtotal: 0,
      isTotalsLoading: true,
    });

    expect(screen.getByRole('radio', { name: /15%/ })).toBeInTheDocument();

    await user.click(screen.getByTestId('move-subtotal'));

    expect(
      screen.queryByRole('radio', { name: /15%/ })
    ).not.toBeInTheDocument();
  });

  it('keeps fixed-amount presets, which are worth what they say', async () => {
    renderTipsForm({
      initialSubtotal: 0,
      nextSubtotal: 0,
      options: {
        default: { amounts: [300, 500, 700], percentages: null },
        thresholds: null,
      },
    });

    expect(screen.getByRole('radio', { name: /\$5\.00/ })).toBeInTheDocument();
  });
});

describe('TipsForm presets the API would reject', () => {
  it('offers only the presets the order total leaves room for', async () => {
    // A $100 order discounted to $18. The presets are a proportion of the
    // subtotal, the limit is the total, so the larger two are unpayable.
    renderTipsForm({
      initialSubtotal: 10000,
      nextSubtotal: 10000,
      initialOrderTotal: 1800,
    });

    // 18% is worth exactly the limit, which is within it.
    expect(screen.getByRole('radio', { name: /15%/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /18%/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /20%/ })
    ).not.toBeInTheDocument();
  });

  it('drops every default preset on a heavily discounted order', async () => {
    // The reported case: $200 of items for $10, where 15% would submit $30
    // against a $10 limit. Rather than three buttons that all fail at Pay, the
    // customer is left the two that cannot.
    const { user } = renderTipsForm({
      initialSubtotal: 20000,
      nextSubtotal: 20000,
      initialOrderTotal: 1000,
    });

    expect(screen.queryByRole('radio', { name: /%/ })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /no tip/i })).toBeInTheDocument();

    // A tip is still possible, it just cannot be one of the presets.
    await user.click(screen.getByRole('radio', { name: /custom amount/i }));
    const input = await screen.findByPlaceholderText('0.00');
    await user.type(input, '5');
    await user.tab();

    expect(screen.getByTestId('tip-amount')).toHaveTextContent('500');
  });

  it('does not offer percentages in place of unpayable fixed amounts', async () => {
    // The merchant chose fixed amounts. None of them fit, but percentages are
    // not a substitute they asked for.
    renderTipsForm({
      initialSubtotal: 20000,
      nextSubtotal: 20000,
      initialOrderTotal: 1000,
      options: {
        default: { amounts: [2500, 5000, 10000], percentages: null },
        thresholds: null,
      },
    });

    expect(screen.queryByRole('radio', { name: /\$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /%/ })).not.toBeInTheDocument();
  });

  it('keeps the fixed amounts that fit', async () => {
    renderTipsForm({
      initialSubtotal: 20000,
      nextSubtotal: 20000,
      initialOrderTotal: 1000,
      options: {
        default: { amounts: [500, 1000, 2500], percentages: null },
        thresholds: null,
      },
    });

    expect(screen.getByRole('radio', { name: /\$5\.00/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /\$10\.00/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /\$25\.00/ })
    ).not.toBeInTheDocument();
  });

  it('clears a selection a discount put out of reach', async () => {
    // 20% of $100 is $20, fine against the undiscounted order. The discount code
    // lands afterwards and the subtotal it was worked out from does not move.
    const { user } = renderTipsForm({
      initialSubtotal: 10000,
      nextSubtotal: 10000,
      initialOrderTotal: 10000,
      nextOrderTotal: 1600,
    });

    await user.click(screen.getByRole('radio', { name: /20%/ }));
    expect(screen.getByTestId('tip-amount')).toHaveTextContent('2000');

    await user.click(screen.getByTestId('move-subtotal'));

    // The button is gone, and so is the amount it put in form state — otherwise
    // $20 would be charged with nothing on screen selected for it.
    expect(
      screen.queryByRole('radio', { name: /20%/ })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('tip-amount')).toHaveTextContent('0');
    expect(screen.getByTestId('tip-percentage')).toHaveTextContent('null');

    // Not turned into a "No tip" the customer never chose, and 15% still fits.
    expect(screen.getByRole('radio', { name: /no tip/i })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    expect(screen.getByRole('radio', { name: /15%/ })).toBeInTheDocument();
  });

  it('leaves a custom amount over the limit for the API to reject', async () => {
    // The customer typed it rather than picked it from what was offered, so it
    // is not the UI's to withdraw.
    const { user } = renderTipsForm({
      initialSubtotal: 20000,
      nextSubtotal: 20000,
      initialOrderTotal: 1000,
    });

    await user.click(screen.getByRole('radio', { name: /custom amount/i }));
    const input = await screen.findByPlaceholderText('0.00');
    await user.type(input, '50');
    await user.tab();

    expect(screen.getByTestId('tip-amount')).toHaveTextContent('5000');
  });

  it('offers every preset while the totals are still loading', async () => {
    // A total of 0 is the absence of one, not a limit of nothing.
    renderTipsForm({
      initialSubtotal: 10000,
      nextSubtotal: 10000,
      initialOrderTotal: 0,
      nextOrderTotal: 1600,
      isTotalsLoading: true,
    });

    expect(screen.getByRole('radio', { name: /20%/ })).toBeInTheDocument();
  });

  it('offers every preset on an order with nothing left to pay', async () => {
    // A fully discounted order can still be tipped, so a zero total is left for
    // the API to rule on rather than read as a limit of nothing.
    renderTipsForm({
      initialSubtotal: 10000,
      nextSubtotal: 10000,
      initialOrderTotal: 0,
    });

    expect(screen.getByRole('radio', { name: /20%/ })).toHaveTextContent(
      '$20.00'
    );
  });
});
