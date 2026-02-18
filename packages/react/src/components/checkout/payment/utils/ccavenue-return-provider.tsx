'use client';

import { useEffect, useRef } from 'react';
import {
  redirectToSuccessUrl,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useGoDaddyContext } from '@/godaddy-provider';
import { confirmCheckout } from '@/lib/godaddy/godaddy';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';

export function CCAvenueReturnProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    session,
    setCheckoutErrors,
    setIsConfirmingCheckout,
  } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const hasRun = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || hasRun.current) return;

    const params = new URLSearchParams(window.location.search);
    const encResp = params.get('encResp');
    if (!encResp) return;

    // Wait for session from context (cookie); re-run when session loads
    if (!session?.token || !session?.id) {
      return;
    }

    hasRun.current = true;
    setIsConfirmingCheckout(true);
    setCheckoutErrors(undefined);

    const confirmInput = {
      paymentToken: encResp,
      paymentType: 'ccavenue' as const,
      paymentProvider: PaymentProvider.CCAVENUE,
    };

    (async () => {
      try {

        await confirmCheckout(confirmInput, session, apiHost);

        const url = new URL(window.location.href);
        url.searchParams.delete('encResp');
        url.searchParams.delete('sessionId');
        window.history.replaceState({}, '', url.pathname + url.search);

        redirectToSuccessUrl(session.successUrl);
      } catch (err) {
        if (err instanceof GraphQLErrorWithCodes) {
          setCheckoutErrors(err.codes);
        } else {
          setCheckoutErrors([
            err instanceof Error
              ? err.message
              : 'Payment confirmation failed.',
          ]);
        }
      } finally {
        setIsConfirmingCheckout(false);
      }
    })();
  }, [
    apiHost,
    session?.token,
    session?.id,
    session?.successUrl,
    setCheckoutErrors,
    setIsConfirmingCheckout,
  ]);

  return <>{children}</>;
}
