import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { useCheckoutContext } from '@/components/checkout/checkout';
import { type CheckoutSession, PaymentProvider } from '@/types';

const collectCDN = 'https://collect.commerce.godaddy.com/sdk.js';
const context: {
  session: {
    businessId?: CheckoutSession['businessId'];
    paymentMethods?: Partial<
      NonNullable<CheckoutSession['paymentMethods']>
    > | null;
  };
  godaddyPaymentsConfig: ReturnType<
    typeof useCheckoutContext
  >['godaddyPaymentsConfig'];
} = {
  session: { businessId: 'business-1', paymentMethods: {} },
  godaddyPaymentsConfig: undefined,
};

vi.mock('@/components/checkout/checkout', () => ({
  useCheckoutContext: () => context,
}));
vi.mock('./use-poynt-collect-cdn', () => ({
  useGetPoyntCollectCdn: () => collectCDN,
}));

function getCollectScripts() {
  return document.querySelectorAll<HTMLScriptElement>(
    `script[src="${collectCDN}"]`
  );
}

describe('useLoadPoyntCollect', () => {
  let useLoadPoyntCollect: typeof import('./use-load-poynt-collect').useLoadPoyntCollect;

  beforeEach(async () => {
    // Each test starts with a fresh page's module-level SDK loading state.
    vi.resetModules();
    ({ useLoadPoyntCollect } = await import('./use-load-poynt-collect'));
    context.session = { businessId: 'business-1', paymentMethods: {} };
    context.godaddyPaymentsConfig = undefined;
  });

  afterEach(() => {
    cleanup();
    getCollectScripts().forEach(script => script.remove());
  });

  it.each([
    { name: 'missing', paymentMethods: undefined },
    { name: 'null', paymentMethods: null },
    { name: 'empty', paymentMethods: {} },
    {
      name: 'Stripe-only',
      paymentMethods: {
        card: {
          processor: PaymentProvider.STRIPE,
          checkoutTypes: ['standard'],
        },
        applePay: null,
      },
    },
    {
      name: 'offline-only',
      paymentMethods: {
        offline: {
          processor: PaymentProvider.OFFLINE,
          checkoutTypes: ['standard'],
        },
      },
    },
  ])(
    'does not insert Collect for $name payment methods',
    ({ paymentMethods }) => {
      context.session.paymentMethods = paymentMethods;

      const { result } = renderHook(() => useLoadPoyntCollect());

      expect(getCollectScripts()).toHaveLength(0);
      expect(result.current.isPoyntLoaded).toBe(false);
    }
  );

  it.each(['card', 'ach', 'applePay', 'googlePay', 'paze', 'express'])(
    'loads Collect for GoDaddy %s without an app ID or provider config',
    method => {
      context.session.paymentMethods = {
        [method]: {
          processor: PaymentProvider.GODADDY,
          checkoutTypes: [method === 'express' ? 'express' : 'standard'],
        },
      };

      const { result } = renderHook(() => useLoadPoyntCollect());

      expect(getCollectScripts()).toHaveLength(1);
      expect(getCollectScripts()[0].async).toBe(true);
      expect(result.current.isPoyntLoaded).toBe(false);
      act(() => getCollectScripts()[0].dispatchEvent(new Event('load')));
      expect(result.current.isPoyntLoaded).toBe(true);
    }
  );

  it.each([undefined, '', 'app-1'])(
    'loads Collect with a configured business ID and app ID %j',
    appId => {
      context.session.businessId = undefined;
      context.session.paymentMethods = {
        card: {
          processor: PaymentProvider.GODADDY,
          checkoutTypes: ['standard'],
        },
      };
      context.godaddyPaymentsConfig = { businessId: 'business-1', appId };

      renderHook(() => useLoadPoyntCollect());

      expect(getCollectScripts()).toHaveLength(1);
    }
  );

  it('does not load Collect without a business ID', () => {
    context.session.businessId = undefined;
    context.session.paymentMethods = {
      card: { processor: PaymentProvider.GODADDY, checkoutTypes: ['standard'] },
    };

    renderHook(() => useLoadPoyntCollect());

    expect(getCollectScripts()).toHaveLength(0);
  });

  it('loads once when a GoDaddy method becomes available alongside Stripe', () => {
    context.session.paymentMethods = {
      card: { processor: PaymentProvider.STRIPE, checkoutTypes: ['standard'] },
    };
    const { rerender } = renderHook(() => useLoadPoyntCollect());
    expect(getCollectScripts()).toHaveLength(0);

    context.session.paymentMethods = {
      ...context.session.paymentMethods,
      applePay: {
        processor: PaymentProvider.GODADDY,
        checkoutTypes: ['standard'],
      },
    };
    rerender();
    renderHook(() => useLoadPoyntCollect());

    expect(getCollectScripts()).toHaveLength(1);
  });
});
