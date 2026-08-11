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
  options,
}: {
  initialSubtotal: number;
  nextSubtotal: number;
  options?: TipsOptions;
}) {
  const [subtotal, setSubtotal] = useState(initialSubtotal);
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
        <TipsForm subtotal={subtotal} options={options} currencyCode='USD' />
        <button
          type='button'
          data-testid='move-subtotal'
          onClick={() => setSubtotal(nextSubtotal)}
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
    const { user } = renderTipsForm({ initialSubtotal: 0, nextSubtotal: 2500 });

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
