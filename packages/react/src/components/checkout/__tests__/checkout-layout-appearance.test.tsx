import { render, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  baseCheckoutSchema,
  Checkout,
  LayoutSections,
} from '@/components/checkout/checkout';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  flushPromises,
  getOperations,
  renderCheckoutWithProps,
  waitForCheckoutReady,
} from './checkout-test-env';

function sectionHeadingsInDomOrder() {
  return screen
    .getAllByRole('heading', { level: 3 })
    .map(heading => heading.textContent?.trim());
}

const targetSlots = [
  'checkout.form.contact.before',
  'checkout.form.contact.after',
  'checkout.form.delivery.before',
  'checkout.form.delivery.after',
  'checkout.form.tips.before',
  'checkout.form.tips.after',
  'checkout.form.pickup.form.before',
  'checkout.form.payment.before',
  'checkout.form.payment.after',
  'checkout.form.express-checkout.before',
  'checkout.form.express-checkout.after',
  'checkout.summary.line-items.before',
  'checkout.summary.line-items.after',
  'checkout.summary.totals.subtotal.before',
  'checkout.summary.totals.discount.before',
  'checkout.summary.totals.shipping.before',
  'checkout.summary.totals.tip.before',
  'checkout.summary.totals.taxes.before',
  'checkout.summary.totals.fees.before',
  'checkout.summary.totals.after',
  'checkout.summary.totals.total-due.before',
  'checkout.summary.totals.total-due.after',
] as const;

function CustomFieldProbe() {
  const form = useFormContext();

  return (
    <div>
      <label htmlFor='custom-required-field'>Custom required field</label>
      <input id='custom-required-field' {...form.register('customRequired')} />
    </div>
  );
}

describe('Checkout layout, targets, appearance, and loading states', () => {
  it('honors custom layout ordering and appends omitted sections', async () => {
    const { container } = renderCheckoutWithProps({
      layout: [
        LayoutSections.PAYMENT,
        LayoutSections.CONTACT,
        LayoutSections.SHIPPING,
      ],
    });
    await waitForCheckoutReady();

    const layoutGrid = Array.from(
      container.querySelectorAll<HTMLElement>('form > div')
    ).find(element => element.style.gridTemplateAreas);

    expect(layoutGrid?.style.gridTemplateAreas).toMatch(
      /payment.*contact.*shipping.*delivery/
    );
  });

  it('filters shipping and pickup layout sections by selected delivery method', async () => {
    const { user } = renderCheckoutWithProps({
      layout: [
        LayoutSections.PICKUP,
        LayoutSections.SHIPPING,
        LayoutSections.CONTACT,
        LayoutSections.PAYMENT,
      ],
    });
    await waitForCheckoutReady();

    expect(sectionHeadingsInDomOrder()).toContain('Shipping');
    expect(sectionHeadingsInDomOrder()).not.toContain('Local Pickup');

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));

    await waitFor(() => {
      expect(sectionHeadingsInDomOrder()).toContain('Local Pickup');
      expect(sectionHeadingsInDomOrder()).not.toContain('Shipping');
    });
  });

  it('uses rtl grid classes when direction="rtl"', async () => {
    const { container } = renderCheckoutWithProps({ direction: 'rtl' });
    await waitForCheckoutReady();

    const grid = container.querySelector('.grid.min-h-screen');
    expect(grid?.className).toContain('md:grid-cols-[1fr_minmax');
    expect(grid?.className).toContain("md:[grid-template-areas:'right_left']");
  });

  it('renders target content in checkout, form, section, summary, and submit slots', async () => {
    renderCheckoutWithProps({
      targets: {
        'checkout.before': () => <span>target checkout before</span>,
        'checkout.after': () => <span>target checkout after</span>,
        'checkout.form.before': () => <span>target form before</span>,
        'checkout.form.after': () => <span>target form after</span>,
        'checkout.form.shipping.before': () => (
          <span>target shipping before</span>
        ),
        'checkout.form.shipping.after': () => (
          <span>target shipping after</span>
        ),
        'checkout.summary.before': () => <span>target summary before</span>,
        'checkout.summary.after': () => <span>target summary after</span>,
        'checkout.form.submit.before': () => <span>target submit before</span>,
        'checkout.form.submit.after': () => <span>target submit after</span>,
      },
    });
    await waitForCheckoutReady();

    for (const text of [
      'target checkout before',
      'target checkout after',
      'target form before',
      'target form after',
      'target shipping before',
      'target shipping after',
      'target summary before',
      'target summary after',
      'target submit before',
      'target submit after',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it('applies theme and CSS variables from appearance', async () => {
    renderCheckoutWithProps(
      {
        appearance: {
          variables: {
            background: '#010203',
            primary: '#abcdef',
          },
        },
      },
      {
        sessionOverrides: {
          appearance: {
            theme: 'purple',
          },
        },
      }
    );
    await waitForCheckoutReady();

    expect(document.documentElement).toHaveClass('theme-purple');
    expect(
      document.documentElement.style.getPropertyValue('--gd-background')
    ).toBe('#010203');
    expect(
      document.documentElement.style.getPropertyValue('--gd-primary')
    ).toBe('#abcdef');
  });

  it('renders all canonical Phase 7 target slots from a fixture list', async () => {
    const targets = Object.fromEntries(
      targetSlots.map(slot => [
        slot,
        () => <span data-testid={`target-${slot}`}>{slot}</span>,
      ])
    );

    renderCheckoutWithProps(
      { targets },
      {
        sessionOverrides: {
          enableTips: true,
          enableLocalPickup: true,
          enablePromotionCodes: true,
          paymentMethods: {
            card: null as never,
            ach: null,
            paypal: null,
            applePay: null,
            googlePay: null,
            paze: null,
            mercadopago: null,
            ccavenue: null,
            offline: null,
            express: {
              processor: 'stripe',
              checkoutTypes: ['express'],
            },
          },
        },
        draftOrderOverrides: {
          lineItems: [{ fulfillmentMode: 'PICKUP' }],
          discounts: [
            { code: 'SAVE10', amount: { value: 100, currencyCode: 'USD' } },
          ],
          totals: {
            subTotal: { value: 2500, currencyCode: 'USD' },
            discountTotal: { value: 100, currencyCode: 'USD' },
            shippingTotal: { value: 0, currencyCode: 'USD' },
            taxTotal: { value: 200, currencyCode: 'USD' },
            feeTotal: { value: 50, currencyCode: 'USD' },
            total: { value: 2950, currencyCode: 'USD' },
          },
        },
      }
    );
    await waitForCheckoutReady();

    for (const slot of targetSlots) {
      expect(screen.getAllByTestId(`target-${slot}`).length).toBeGreaterThan(0);
    }
  });

  it('applies appearance element classes to representative controls', async () => {
    renderCheckoutWithProps({
      appearance: {
        elements: {
          input: 'appearance-input',
          select: 'appearance-select',
          button: 'appearance-button',
          checkbox: 'appearance-checkbox',
        },
      },
    });
    await waitForCheckoutReady();

    expect(document.querySelector('input[name="contactEmail"]')).toHaveClass(
      'appearance-input'
    );
    expect(
      screen.getByRole('combobox', { name: /state\/province/i })
    ).toHaveClass('appearance-select');
    expect(screen.getAllByRole('button', { name: /apply/i }).at(0)).toHaveClass(
      'appearance-button'
    );
    expect(
      screen.getByRole('checkbox', {
        name: /use shipping address as billing address/i,
      })
    ).toHaveClass('appearance-checkbox');
  });

  it('uses the session appearance theme over props appearance theme', async () => {
    renderCheckoutWithProps(
      { appearance: { theme: 'base' } },
      { sessionOverrides: { appearance: { theme: 'purple' } } }
    );
    await waitForCheckoutReady();

    expect(document.documentElement).toHaveClass('theme-purple');
  });

  it('uses ltr template areas by default and flips them for rtl', async () => {
    const ltr = renderCheckoutWithProps({});
    await waitForCheckoutReady();
    expect(
      ltr.container.querySelector('.grid.min-h-screen')?.className
    ).toContain("md:[grid-template-areas:'left_right']");
    ltr.unmount();

    const rtl = renderCheckoutWithProps({ direction: 'rtl' });
    await waitForCheckoutReady();
    expect(
      rtl.container.querySelector('.grid.min-h-screen')?.className
    ).toContain("md:[grid-template-areas:'right_left']");
  });

  it('blocks submit with a custom checkoutFormSchema required field until it is filled', async () => {
    const customMessage = 'Enter the custom required field';
    const { user } = renderCheckoutWithProps(
      {
        checkoutFormSchema: {
          customRequired: z.string().min(1, customMessage),
        },
        targets: {
          'checkout.form.payment.before': CustomFieldProbe,
        },
      },
      {
        sessionOverrides: {
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: false,
        },
        draftOrderOverrides: {
          lineItems: [{ fulfillmentMode: 'PURCHASE' }],
        },
        apiOverrides: { suppressTokenNonce: true },
      }
    );
    await waitForCheckoutReady();

    await user.click(await screen.findByRole('button', { name: /pay now/i }));
    expect(getOperations('TokenizeJs.getNonce')).toHaveLength(0);

    await user.type(
      screen.getByLabelText(/custom required field/i),
      'custom value'
    );
    await user.click(await screen.findByRole('button', { name: /pay now/i }));
    await waitFor(() => {
      expect(getOperations('TokenizeJs.getNonce')).toHaveLength(1);
    });
  });

  it('renders custom loadingFallback while loading', async () => {
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({ draftOrder, token: '' });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { ...session, draftOrder },
    });

    render(
      <GoDaddyProvider
        queryClient={queryClient}
        apiHost='api.godaddy.test'
        clientId='client-1'
      >
        <Checkout
          session={session}
          isLoading
          loadingFallback={<div>Custom checkout loading</div>}
        />
      </GoDaddyProvider>
    );

    expect(screen.getByText('Custom checkout loading')).toBeInTheDocument();
    await flushPromises();
  });

  it('renders the default CheckoutSkeleton while loading', async () => {
    const draftOrder = buildDraftOrder();
    // Empty token prevents useCheckoutSession from starting an async token
    // exchange while this test is only asserting the loading skeleton.
    const session = buildCheckoutSession({ draftOrder, token: '' });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { ...session, draftOrder },
    });

    const { container } = render(
      <GoDaddyProvider
        queryClient={queryClient}
        apiHost='api.godaddy.test'
        clientId='client-1'
      >
        <Checkout session={session} isLoading />
      </GoDaddyProvider>
    );

    expect(container.querySelector('.grid.min-h-screen')).toBeInTheDocument();
    expect(screen.queryByText('Contact')).not.toBeInTheDocument();

    await flushPromises();
  });
});
