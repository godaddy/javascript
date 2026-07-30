import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearRedirectTipAmount,
  getRedirectTipAmount,
  setRedirectTipAmount,
} from '@/lib/redirect-tip-storage';
import { CheckoutType, PaymentMethodType, PaymentProvider } from '@/types';
import {
  clearOperations,
  getOperations,
  renderCheckout,
  setCheckoutUrl,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastConfirmInput } from './checkout-test-fixtures';

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
    clearRedirectTipAmount();
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

      await user.click(await screen.findByRole('button', { name: /20%/ }));
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

      await user.click(await screen.findByRole('button', { name: /20%/ }));
      await waitFor(() => {
        expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
      });

      await user.click(
        await screen.findByRole('button', { name: /pay with ccavenue/i })
      );
      await waitForOperation('AuthorizeCheckoutSession');

      expect(getRedirectTipAmount(session.id)).toBeNull();
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

    it('confirms with a zero tip when nothing was persisted', async () => {
      setCheckoutUrl({
        pathname: '/checkout/checkout-session-1',
        search: 'encResp=enc-resp-1',
      });

      renderCCAvenueCheckout();
      await waitForOperation('ConfirmCheckoutSession');

      expect(getLastConfirmInput()).toMatchObject({ tipAmount: 0 });
    });
  });
});
