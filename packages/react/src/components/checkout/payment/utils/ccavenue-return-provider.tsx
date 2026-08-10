'use client';

import { useEffect, useRef } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import {
  clearRedirectTipAmount,
  getRedirectTipAmount,
} from '@/lib/redirect-tip-storage';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';

export function CCAvenueReturnProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, jwt, setCheckoutErrors } = useCheckoutContext();
  const confirmCheckout = useConfirmCheckout();
  const hasRun = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || hasRun.current) return;

    const params = new URLSearchParams(window.location.search);
    const encResp = params.get('encResp');
    if (!encResp) return;

    // Wait for session from context (cookie); re-run when session loads
    if (!(session?.token || jwt) || !session?.id) {
      return;
    }

    hasRun.current = true;

    const sessionId = session.id;
    const authorizedTipAmount = getRedirectTipAmount(sessionId);

    // The gateway has already collected a tip-inclusive amount by this point, so
    // the confirmation still has to go through even when the tip cannot be
    // recovered — refusing would leave the customer paid with no order. The
    // redirect leg refuses to send a customer whose tip could not be persisted,
    // so reaching here means storage was cleared mid-redirect: report it, since
    // the order is about to be recorded for less than was charged.
    if (session.enableTips && authorizedTipAmount === null) {
      track({
        eventId: eventIds.redirectTipUnrecoverable,
        type: TrackingEventType.EVENT,
        properties: {
          provider: PaymentProvider.CCAVENUE,
          draftOrderId: session.draftOrder?.id || 'unknown',
        },
      });
    }

    const confirmInput = {
      paymentToken: encResp,
      paymentType: 'ccavenue' as const,
      paymentProvider: PaymentProvider.CCAVENUE,
      ...(authorizedTipAmount === null
        ? {}
        : { tipAmount: authorizedTipAmount }),
    };

    confirmCheckout
      .mutateAsync(confirmInput)
      .then(() => {
        clearRedirectTipAmount(sessionId);
      })
      .catch(err => {
        if (err instanceof GraphQLErrorWithCodes) {
          setCheckoutErrors(err.codes);
        } else {
          setCheckoutErrors([
            err instanceof Error ? err.message : 'Payment confirmation failed.',
          ]);
        }
      });
  }, [session?.token, session?.id, setCheckoutErrors]);

  return <>{children}</>;
}
