import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { useStripePaymentIntent } from '@/components/checkout/payment/utils/use-stripe-payment-intent';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  buildCheckoutSession,
  createTestQueryClient,
} from '../../__tests__/checkout-test-env';

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({})),
}));

let totalValue = 2500;

vi.mock('@/components/checkout/order/use-draft-order', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@/components/checkout/order/use-draft-order')
    >();
  return {
    ...actual,
    useDraftOrderTotals: () => ({
      data: { total: { value: totalValue, currencyCode: 'USD' } },
      isLoading: false,
    }),
  };
});

interface IntentRequest {
  url: string;
  amount: number;
  id?: string;
}

let requests: IntentRequest[] = [];

function stubIntentApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      requests.push({ url: String(url), amount: body.amount, id: body.id });

      const id = body.id ?? `pi_${requests.length}`;
      return {
        ok: true,
        json: async () => ({ clientSecret: `${id}_secret`, id }),
      };
    })
  );
}

function Probe({
  enableClientSecret = true,
  updateIntent = true,
  isExpress = false,
}: {
  enableClientSecret?: boolean;
  updateIntent?: boolean;
  isExpress?: boolean;
}) {
  const form = useFormContext<CheckoutFormData>();
  const { clientSecret, amount } = useStripePaymentIntent({
    enableClientSecret,
    updateIntent,
    isExpress,
  });

  return (
    <>
      <div data-testid='client-secret'>{clientSecret ?? 'none'}</div>
      <div data-testid='amount'>{amount}</div>
      <button
        type='button'
        onClick={() => form.setValue('tipAmount', 500)}
        data-testid='add-tip'
      >
        Add tip
      </button>
      <button
        type='button'
        onClick={() => {
          form.setValue('stripePaymentIntent', 'pi_host_2_secret');
          form.setValue('stripePaymentIntentId', 'pi_host_2');
        }}
        data-testid='replace-host-intent'
      >
        Replace host intent
      </button>
    </>
  );
}

function Host({
  hostIntent = false,
  enableClientSecret = true,
  updateIntent = true,
  isExpress = false,
}: {
  hostIntent?: boolean;
  enableClientSecret?: boolean;
  updateIntent?: boolean;
  isExpress?: boolean;
}) {
  const methods = useForm<CheckoutFormData>({
    defaultValues: {
      tipAmount: 0,
      ...(hostIntent
        ? {
            stripePaymentIntent: 'pi_host_secret',
            stripePaymentIntentId: 'pi_host',
          }
        : {}),
    } as Partial<CheckoutFormData>,
  });

  return (
    <checkoutContext.Provider
      value={{
        session: buildCheckoutSession({ enableTips: true }),
        stripeConfig: { publishableKey: 'pk_test_1' },
        isConfirmingCheckout: false,
        setIsConfirmingCheckout: () => undefined,
        checkoutErrors: undefined,
        setCheckoutErrors: () => undefined,
      }}
    >
      <FormProvider {...methods}>
        <Probe
          enableClientSecret={enableClientSecret}
          updateIntent={updateIntent}
          isExpress={isExpress}
        />
      </FormProvider>
    </checkoutContext.Provider>
  );
}

function renderProbe(props: Parameters<typeof Host>[0] = {}) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <GoDaddyProvider queryClient={createTestQueryClient()}>
      <Host {...props} />
    </GoDaddyProvider>
  );
  return { user };
}

async function waitForClientSecret(value: string) {
  await waitFor(() => {
    expect(screen.getByTestId('client-secret')).toHaveTextContent(value);
  });
}

describe('useStripePaymentIntent', () => {
  beforeEach(() => {
    requests = [];
    totalValue = 2500;
    stubIntentApi();
  });

  it('creates the intent for the tip-inclusive amount', async () => {
    renderProbe();

    await waitForClientSecret('pi_1_secret');
    expect(requests).toEqual([
      { url: '/api/create-payment-intent', amount: 2500, id: undefined },
    ]);
  });

  it('leaves the tip out of the express amount', async () => {
    // The express wallet sheet is built from the subtotal plus the shipping and
    // taxes it calculates itself, and its confirmation records no tip. Charging
    // the tip here would take money the order never accounts for.
    const { user } = renderProbe({ isExpress: true });
    await waitForClientSecret('pi_1_secret');

    await user.click(screen.getByTestId('add-tip'));
    await waitForClientSecret('pi_1_secret');

    expect(screen.getByTestId('amount')).toHaveTextContent('2500');
    expect(requests).toEqual([
      { url: '/api/create-payment-intent', amount: 2500, id: undefined },
    ]);
  });

  it('updates the intent when a tip is added after it was created', async () => {
    const { user } = renderProbe();
    await waitForClientSecret('pi_1_secret');

    await user.click(screen.getByTestId('add-tip'));

    await waitFor(() => {
      expect(requests).toHaveLength(2);
    });
    expect(requests[1]).toEqual({
      url: '/api/update-payment-intent',
      amount: 3000,
      id: 'pi_1',
    });
    expect(screen.getByTestId('amount')).toHaveTextContent('3000');
  });

  it('recreates the intent for the new amount when updates are disabled', async () => {
    const { user } = renderProbe({ updateIntent: false });
    await waitForClientSecret('pi_1_secret');

    await user.click(screen.getByTestId('add-tip'));

    await waitFor(() => {
      expect(requests).toHaveLength(2);
    });
    expect(requests[1]).toMatchObject({
      url: '/api/create-payment-intent',
      amount: 3000,
    });
    await waitForClientSecret('pi_2_secret');
  });

  it('updates a host-supplied intent when a tip is added', async () => {
    const { user } = renderProbe({ hostIntent: true });
    await waitForClientSecret('pi_host_secret');
    expect(requests).toHaveLength(0);

    await user.click(screen.getByTestId('add-tip'));

    await waitFor(() => {
      expect(requests).toHaveLength(1);
    });
    expect(requests[0]).toEqual({
      url: '/api/update-payment-intent',
      amount: 3000,
      id: 'pi_host',
    });
  });

  it('adopts a replacement intent supplied by the host', async () => {
    const { user } = renderProbe({ hostIntent: true });
    await waitForClientSecret('pi_host_secret');

    await user.click(screen.getByTestId('replace-host-intent'));

    await waitForClientSecret('pi_host_2_secret');
    expect(requests).toHaveLength(0);
  });

  it('does not touch the intent while the amount is unchanged', async () => {
    const { user } = renderProbe();
    await waitForClientSecret('pi_1_secret');

    await user.click(screen.getByTestId('add-tip'));
    await waitFor(() => {
      expect(requests).toHaveLength(2);
    });

    await user.click(screen.getByTestId('add-tip'));
    await waitForClientSecret('pi_1_secret');

    expect(requests).toHaveLength(2);
  });
});
