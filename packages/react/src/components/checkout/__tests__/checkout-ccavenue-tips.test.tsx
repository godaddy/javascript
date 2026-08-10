import { enUs } from '@godaddy/localizations';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getRedirectTipAmount,
  setRedirectTipAmount,
} from '@/lib/redirect-tip-storage';
import { eventIds } from '@/tracking/events';
import { CheckoutType, PaymentMethodType, PaymentProvider } from '@/types';
import {
  clearOperations,
  getOperations,
  mockTrack,
  renderCheckout,
  setCheckoutUrl,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastConfirmInput } from './checkout-test-fixtures';

vi.mock('@/tracking/track', async importOriginal => {
  const actual = await importOriginal<typeof import('@/tracking/track')>();
  return { ...actual, track: vi.fn() };
});

const tracking = mockTrack();

const CCAVENUE_SESSION = {
  enableTips: true,
  enableShipping: false,
  enableLocalPickup: false,
  enableTaxCollection: false,
  paymentMethods: {
    card: null,
    ccavenue: {
      type: PaymentMethodType.CCAVENUE,
      processor: PaymentProvider.CCAVENUE,
      checkoutTypes: [CheckoutType.STANDARD],
    },
  },
};

const CCAVENUE_PROPS = {
  ccavenueConfig: { accessCodeId: 'access-code-1' },
};

function renderCCAvenueCheckout() {
  return renderCheckout({
    checkoutProps: CCAVENUE_PROPS,
    sessionOverrides: CCAVENUE_SESSION,
  });
}

function getAuthorizeInput() {
  return getOperations('AuthorizeCheckoutSession').at(-1)?.input as
    | Record<string, unknown>
    | undefined;
}

describe('Checkout CCAvenue tips', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    tracking.clearTrackedEvents();
    setCheckoutUrl();
  });

  describe('redirect to the gateway', () => {
    it('persists the tip the redirect authorized', async () => {
      const submit = vi
        .spyOn(HTMLFormElement.prototype, 'submit')
        .mockImplementation(() => undefined);
      const { user, session } = renderCCAvenueCheckout();
      await waitForCheckoutReady();
      clearOperations();

      await user.click(await screen.findByRole('radio', { name: /20%/ }));
      await waitFor(() => {
        expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
      });

      await user.click(
        await screen.findByRole('button', { name: /pay with ccavenue/i })
      );
      await waitForOperation('AuthorizeCheckoutSession');

      expect(getAuthorizeInput()).toMatchObject({ tipAmount: 500 });
      expect(getRedirectTipAmount(session.id)).toBe(500);
      await waitFor(() => {
        expect(submit).toHaveBeenCalled();
      });
    });

    it('persists a zero tip when no tip is selected', async () => {
      vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(
        () => undefined
      );
      const { user, session } = renderCCAvenueCheckout();
      await waitForCheckoutReady();
      clearOperations();

      await user.click(
        await screen.findByRole('button', { name: /pay with ccavenue/i })
      );
      await waitForOperation('AuthorizeCheckoutSession');

      expect(getRedirectTipAmount(session.id)).toBe(0);
    });

    it('does not persist a tip when tips are disabled', async () => {
      vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(
        () => undefined
      );
      const { user, session } = renderCheckout({
        checkoutProps: CCAVENUE_PROPS,
        sessionOverrides: { ...CCAVENUE_SESSION, enableTips: false },
      });
      await waitForCheckoutReady();
      clearOperations();

      await user.click(
        await screen.findByRole('button', { name: /pay with ccavenue/i })
      );
      await waitForOperation('AuthorizeCheckoutSession');

      expect(getRedirectTipAmount(session.id)).toBeNull();
    });

    it('does not persist a tip when the authorization fails', async () => {
      vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(
        () => undefined
      );
      const { user, session } = renderCheckout({
        checkoutProps: CCAVENUE_PROPS,
        sessionOverrides: CCAVENUE_SESSION,
        apiOverrides: {
          errors: { authorizeCheckoutSession: new Error('authorize failed') },
        },
      });
      await waitForCheckoutReady();
      clearOperations();

      await user.click(await screen.findByRole('radio', { name: /20%/ }));
      await waitFor(() => {
        expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
      });

      await user.click(
        await screen.findByRole('button', { name: /pay with ccavenue/i })
      );
      await waitForOperation('AuthorizeCheckoutSession');

      expect(getRedirectTipAmount(session.id)).toBeNull();
    });

    it('does not redirect when the tip cannot be persisted', async () => {
      // Nothing is charged yet, so refusing here is what keeps the customer from
      // paying a tip the return leg could never record.
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage disabled');
      });
      const submit = vi
        .spyOn(HTMLFormElement.prototype, 'submit')
        .mockImplementation(() => undefined);
      const { user } = renderCCAvenueCheckout();
      await waitForCheckoutReady();
      clearOperations();

      await user.click(await screen.findByRole('radio', { name: /20%/ }));
      await waitFor(() => {
        expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
      });

      await user.click(
        await screen.findByRole('button', { name: /pay with ccavenue/i })
      );

      await waitFor(() => {
        expect(
          screen.getAllByText(enUs.apiErrors.TRANSACTION_PROCESSING_FAILED)
            .length
        ).toBeGreaterThan(0);
      });
      expect(submit).not.toHaveBeenCalled();
      expect(getOperations('AuthorizeCheckoutSession')).toHaveLength(0);
    });

    it('still redirects when only a zero tip cannot be persisted', async () => {
      // Losing a zero tip changes nothing, so it must not block checkout.
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage disabled');
      });
      const submit = vi
        .spyOn(HTMLFormElement.prototype, 'submit')
        .mockImplementation(() => undefined);
      const { user } = renderCCAvenueCheckout();
      await waitForCheckoutReady();
      clearOperations();

      await user.click(
        await screen.findByRole('button', { name: /pay with ccavenue/i })
      );
      await waitForOperation('AuthorizeCheckoutSession');

      await waitFor(() => {
        expect(submit).toHaveBeenCalled();
      });
    });
  });

  describe('return from the gateway', () => {
    it('confirms with the tip the redirect authorized', async () => {
      setRedirectTipAmount('checkout-session-1', 500);
      setCheckoutUrl({
        pathname: '/checkout/checkout-session-1',
        search: 'encResp=enc-resp-1',
      });

      renderCCAvenueCheckout();
      await waitForOperation('ConfirmCheckoutSession');

      expect(getLastConfirmInput()).toMatchObject({
        paymentToken: 'enc-resp-1',
        paymentType: 'ccavenue',
        tipAmount: 500,
      });
    });

    it('clears the persisted tip once the confirmation succeeds', async () => {
      setRedirectTipAmount('checkout-session-1', 500);
      setCheckoutUrl({
        pathname: '/checkout/checkout-session-1',
        search: 'encResp=enc-resp-1',
      });

      const { session } = renderCCAvenueCheckout();
      await waitForOperation('ConfirmCheckoutSession');

      await waitFor(() => {
        expect(getRedirectTipAmount(session.id)).toBeNull();
      });
    });

    it('keeps the persisted tip when the confirmation fails', async () => {
      setRedirectTipAmount('checkout-session-1', 500);
      setCheckoutUrl({
        pathname: '/checkout/checkout-session-1',
        search: 'encResp=enc-resp-1',
      });

      const { session } = renderCheckout({
        checkoutProps: CCAVENUE_PROPS,
        sessionOverrides: CCAVENUE_SESSION,
        apiOverrides: {
          errors: { confirmCheckout: new Error('confirm failed') },
        },
      });
      await waitForOperation('ConfirmCheckoutSession');

      expect(getRedirectTipAmount(session.id)).toBe(500);
    });

    it('ignores a tip persisted for a different checkout session', async () => {
      setRedirectTipAmount('checkout-session-other', 500);
      setCheckoutUrl({
        pathname: '/checkout/checkout-session-1',
        search: 'encResp=enc-resp-1',
      });

      renderCCAvenueCheckout();
      await waitForOperation('ConfirmCheckoutSession');

      expect(getLastConfirmInput()).toMatchObject({ tipAmount: 0 });
    });

    it('reads a tip mirrored to localStorage when the tab changed', async () => {
      // The gateway can return the customer to a new tab, which starts with an
      // empty sessionStorage.
      setRedirectTipAmount('checkout-session-1', 500);
      window.sessionStorage.clear();
      setCheckoutUrl({
        pathname: '/checkout/checkout-session-1',
        search: 'encResp=enc-resp-1',
      });

      renderCCAvenueCheckout();
      await waitForOperation('ConfirmCheckoutSession');

      expect(getLastConfirmInput()).toMatchObject({ tipAmount: 500 });
    });

    it('confirms and reports the discrepancy when the tip is unrecoverable', async () => {
      // The customer has already paid a tip-inclusive amount, so the order still
      // has to be created — but the shortfall must not go unrecorded.
      setCheckoutUrl({
        pathname: '/checkout/checkout-session-1',
        search: 'encResp=enc-resp-1',
      });

      renderCCAvenueCheckout();
      await waitForOperation('ConfirmCheckoutSession');

      expect(getLastConfirmInput()).toMatchObject({ tipAmount: 0 });
      tracking.expectTracked(eventIds.redirectTipUnrecoverable);
    });

    it('does not report a discrepancy when tips are disabled', async () => {
      setCheckoutUrl({
        pathname: '/checkout/checkout-session-1',
        search: 'encResp=enc-resp-1',
      });

      renderCheckout({
        checkoutProps: CCAVENUE_PROPS,
        sessionOverrides: { ...CCAVENUE_SESSION, enableTips: false },
      });
      await waitForOperation('ConfirmCheckoutSession');

      expect(
        tracking.getTrackedEvents(eventIds.redirectTipUnrecoverable)
      ).toHaveLength(0);
    });
  });
});
