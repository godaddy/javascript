'use client';

import { useEffect, useRef } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';

export function CCAvenueReturnProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, setCheckoutErrors } = useCheckoutContext();
  const confirmCheckout = useConfirmCheckout();
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

    const confirmInput = {
      paymentToken: encResp,
      paymentType: 'ccavenue' as const,
      paymentProvider: PaymentProvider.CCAVENUE,
    };

    confirmCheckout
      .mutateAsync(confirmInput)
      .catch(err => {
        if (err instanceof GraphQLErrorWithCodes) {
          setCheckoutErrors(err.codes);
        } else {
          setCheckoutErrors([
            err instanceof Error
              ? err.message
              : 'Payment confirmation failed.',
          ]);
        }
      });
  }, [session?.token, session?.id, setCheckoutErrors]);

  return <>{children}</>;
}
