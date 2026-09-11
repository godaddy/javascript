import { LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useAuthorizeCheckout } from '@/components/checkout/payment/utils/use-authorize-checkout';
import { encodeRazorpayPaymentToken } from '@/components/checkout/payment/utils/razorpay-payment-token';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useLoadRazorpay } from '@/components/checkout/payment/utils/use-load-razorpay';
import { normalizePhoneForRazorpay } from '@/components/checkout/utils/checkout-transformers';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { PaymentMethodType } from '@/types';

export const RAZORPAY_CALLBACK_TIMEOUT_MS = 2 * 60 * 1000;

type RazorpaySuccessResponse = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: {
    ondismiss: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  close: () => void;
  on: (
    event: 'payment.failed',
    handler: (response: unknown) => void
  ) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

function getRazorpayConstructor(): RazorpayConstructor | undefined {
  return (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
}

export function RazorpayCheckoutButton() {
  const { t } = useGoDaddyContext();
  const {
    razorpayConfig,
    session,
    setCheckoutErrors,
    isConfirmingCheckout,
  } = useCheckoutContext();
  const form = useFormContext();
  const authorizeCheckout = useAuthorizeCheckout();
  const confirmCheckout = useConfirmCheckout();
  const flushCheckoutSync = useFlushCheckoutSync();
  const isPaymentDisabled = useIsPaymentDisabled();
  const { isRazorpayLoaded, isRazorpayLoadFailed } = useLoadRazorpay();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [error, setError] = useState('');
  const callbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCallbackTimeout = useCallback(() => {
    if (callbackTimeoutRef.current) {
      clearTimeout(callbackTimeoutRef.current);
      callbackTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearCallbackTimeout, [clearCallbackTimeout]);

  const handlePaymentSuccess = useCallback(
    async (response: RazorpaySuccessResponse) => {
      clearCallbackTimeout();
      const paymentId = response.razorpay_payment_id;
      const orderId = response.razorpay_order_id;
      const signature = response.razorpay_signature;
      if (!paymentId || !orderId || !signature) {
        setError(t.errors.errorProcessingPayment);
        setIsWidgetOpen(false);
        return;
      }

      try {
        const paymentToken = encodeRazorpayPaymentToken({
          v: 1,
          paymentId,
          orderId,
          signature,
        });
        await confirmCheckout.mutateAsync({
          paymentToken,
          paymentType: PaymentMethodType.RAZORPAY,
          paymentProvider: PaymentProvider.RAZORPAY,
        });
        setError('');
      } catch (err: unknown) {
        if (err instanceof GraphQLErrorWithCodes) {
          setCheckoutErrors(err.codes);
        } else {
          setError(t.errors.errorProcessingPayment);
        }
      } finally {
        setIsWidgetOpen(false);
      }
    },
    [
      confirmCheckout,
      clearCallbackTimeout,
      setCheckoutErrors,
      t.errors.errorProcessingPayment,
    ]
  );

  const handlePaymentFailure = useCallback(() => {
    setError(t.errors.errorProcessingPayment);
  }, [t.errors.errorProcessingPayment]);

  const handleClick = async () => {
    if (isWidgetOpen || authorizeCheckout.isPending || isConfirmingCheckout) {
      return;
    }

    const valid = await form.trigger();
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) form.setFocus(firstError);
      return;
    }

    setCheckoutErrors(undefined);
    setError('');

    try {
      const { latestOrder } = await flushCheckoutSync({
        includeCurrentFormDiff: true,
      });
      const total = latestOrder?.totals?.total;
      if (
        !latestOrder?.id ||
        total?.value == null ||
        !total.currencyCode
      ) {
        throw new Error('Synchronized draft order is unavailable');
      }

      const contact = latestOrder.billing ?? latestOrder.shipping;
      const buyerName = [contact?.firstName, contact?.lastName]
        .filter(Boolean)
        .join(' ');
      const buyerPhone = normalizePhoneForRazorpay(
        contact?.phone,
        contact?.address?.countryCode
      );

      const authorization = await authorizeCheckout.mutateAsync({
        paymentType: PaymentMethodType.RAZORPAY,
        paymentProvider: PaymentProvider.RAZORPAY,
      });
      const orderId = authorization?.transactionRefNum;
      const Razorpay = getRazorpayConstructor();
      if (
        !orderId?.startsWith('order_') ||
        !razorpayConfig?.publicToken ||
        !isRazorpayLoaded ||
        !Razorpay
      ) {
        throw new Error('Razorpay Checkout configuration is unavailable');
      }

      const widget = new Razorpay({
        key: razorpayConfig.publicToken,
        amount: total.value,
        currency: total.currencyCode,
        name: session?.storeName || undefined,
        description: latestOrder.id,
        order_id: orderId,
        prefill: {
          name: buyerName || undefined,
          email: contact?.email || undefined,
          contact: buyerPhone,
        },
        handler: response => {
          void handlePaymentSuccess(response);
        },
        modal: {
          ondismiss: () => {
            clearCallbackTimeout();
            setIsWidgetOpen(false);
          },
        },
      });
      widget.on('payment.failed', handlePaymentFailure);

      setIsWidgetOpen(true);
      callbackTimeoutRef.current = setTimeout(() => {
        callbackTimeoutRef.current = null;
        widget.close();
        setIsWidgetOpen(false);
        setError(t.errors.errorProcessingPayment);
      }, RAZORPAY_CALLBACK_TIMEOUT_MS);
      widget.open();
    } catch (err: unknown) {
      clearCallbackTimeout();
      setIsWidgetOpen(false);
      if (err instanceof GraphQLErrorWithCodes) {
        setCheckoutErrors(err.codes);
      } else {
        setError(t.errors.errorProcessingPayment);
      }
    }
  };

  const isBusy =
    isPaymentDisabled ||
    isWidgetOpen ||
    authorizeCheckout.isPending ||
    isConfirmingCheckout;

  return (
    <div className='flex flex-col gap-2'>
      {error || isRazorpayLoadFailed ? (
        <p className='text-[0.8rem] font-medium text-destructive'>
          {error || t.errors.failedToInitializePayment}
        </p>
      ) : null}
      <Button
        type='button'
        size='lg'
        className='w-full'
        disabled={isBusy || !isRazorpayLoaded || !razorpayConfig?.publicToken}
        onClick={handleClick}
      >
        {isBusy ? (
          <>
            <LoaderCircle className='h-5 w-5 animate-spin' />
            {t.payment.processingPayment}
          </>
        ) : (
          t.payment.payNow
        )}
      </Button>
    </div>
  );
}
