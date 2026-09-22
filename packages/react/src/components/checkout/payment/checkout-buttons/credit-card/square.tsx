import { useCallback, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useSquare } from '@/components/checkout/payment/utils/square-provider';
import { useBuildPaymentRequest } from '@/components/checkout/payment/utils/use-build-payment-request';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { PaymentMethodType } from '@/types';

export function SquareCreditCardCheckoutButton() {
  const { t } = useGoDaddyContext();
  const { card, isLoading } = useSquare();
  const { buildPaymentRequestsFromOrder } = useBuildPaymentRequest();
  const confirmCheckout = useConfirmCheckout();
  const { session, setCheckoutErrors, isConfirmingCheckout } =
    useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const flushCheckoutSync = useFlushCheckoutSync();
  const form = useFormContext();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isSquareDisabled, setIsSquareDisabled] = useState<boolean>(false);

  const handleSubmit = useCallback(async () => {
    if (!card) {
      return;
    }

    const valid = await form.trigger();
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
      return;
    }

    const { latestOrder } = await flushCheckoutSync({
      includeCurrentFormDiff: true,
    });
    // The buyer can change the tip across the awaited `card.tokenize`, so
    // snapshot it, build the verified amount from it, and confirm that same
    // value. `null` means tips are off, keeping a zero tip distinct from none.
    const tipAmount = session?.enableTips
      ? (form.getValues('tipAmount') ?? 0)
      : null;
    const request = buildPaymentRequestsFromOrder(
      latestOrder ?? undefined
    ).squarePaymentRequest;

    try {
      setIsSquareDisabled(true);
      const cardToken = await card.tokenize(request);

      if (cardToken.status === 'OK' && cardToken?.token) {
        await confirmCheckout.mutateAsync({
          paymentToken: cardToken.token,
          paymentType: PaymentMethodType.CREDIT_CARD,
          paymentProvider: PaymentProvider.SQUARE,
          ...(tipAmount === null ? {} : { tipAmount }),
        });
      }
    } catch (err: unknown) {
      if (err instanceof GraphQLErrorWithCodes) {
        setCheckoutErrors(err.codes);
      }
    } finally {
      setIsSquareDisabled(false);
    }
  }, [
    buildPaymentRequestsFromOrder,
    form,
    flushCheckoutSync,
    card,
    confirmCheckout.mutateAsync,
    session?.enableTips,
    setCheckoutErrors,
  ]);

  return (
    <Button
      className='w-full'
      size='lg'
      type='button'
      onClick={handleSubmit}
      ref={buttonRef}
      disabled={
        isLoading ||
        isConfirmingCheckout ||
        isPaymentDisabled ||
        isSquareDisabled
      }
    >
      {t.payment.payNow}
    </Button>
  );
}
