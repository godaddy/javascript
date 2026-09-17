import { LoaderCircle } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  RazorpayLoaderProvider,
  useRazorpayLoader,
} from '@/components/checkout/payment/utils/razorpay-loader-context';
import { encodeRazorpayPaymentToken } from '@/components/checkout/payment/utils/razorpay-payment-token';
import { useAuthorizeCheckout } from '@/components/checkout/payment/utils/use-authorize-checkout';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { normalizePhoneForRazorpay } from '@/components/checkout/utils/checkout-transformers';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { PaymentMethodType } from '@/types';

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
  on: (event: 'payment.failed', handler: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

function getRazorpayConstructor(): RazorpayConstructor | undefined {
  return (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
}

export function RazorpayCheckoutButton() {
  return (
    <RazorpayLoaderProvider>
      <RazorpayCheckoutButtonInner />
    </RazorpayLoaderProvider>
  );
}

function RazorpayCheckoutButtonInner() {
  const { t } = useGoDaddyContext();
  const { session, setCheckoutErrors, isConfirmingCheckout } =
    useCheckoutContext();
  const form = useFormContext();
  const authorizeCheckout = useAuthorizeCheckout();
  const confirmCheckout = useConfirmCheckout();
  const flushCheckoutSync = useFlushCheckoutSync();
  const isPaymentDisabled = useIsPaymentDisabled();
  const { isRazorpayLoaded, isRazorpayLoadFailed } = useRazorpayLoader();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isAttempting, setIsAttempting] = useState(false);
  const [error, setError] = useState('');
  const attemptLockRef = useRef(false);

  const releasePaymentAttempt = useCallback(() => {
    attemptLockRef.current = false;
    setIsAttempting(false);
  }, []);

  const handlePaymentSuccess = useCallback(
    async (response: RazorpaySuccessResponse) => {
      const paymentId = response.razorpay_payment_id;
      const orderId = response.razorpay_order_id;
      const signature = response.razorpay_signature;
      if (!paymentId || !orderId || !signature) {
        setError(t.errors.errorProcessingPayment);
        setIsWidgetOpen(false);
        releasePaymentAttempt();
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
      } catch (err: unknown) {
        if (err instanceof GraphQLErrorWithCodes) {
          setCheckoutErrors(err.codes);
        } else {
          setError(t.errors.errorProcessingPayment);
        }
      } finally {
        setIsWidgetOpen(false);
        releasePaymentAttempt();
      }
    },
    [
      confirmCheckout,
      releasePaymentAttempt,
      setCheckoutErrors,
      t.errors.errorProcessingPayment,
    ]
  );

  const handlePaymentFailure = useCallback(() => {
    setError(t.errors.errorProcessingPayment);
  }, [t.errors.errorProcessingPayment]);

  const handleClick = async () => {
    if (
      attemptLockRef.current ||
      isWidgetOpen ||
      authorizeCheckout.isPending ||
      isConfirmingCheckout
    ) {
      return;
    }
    attemptLockRef.current = true;
    setIsAttempting(true);

    try {
      const valid = await form.trigger();
      if (!valid) {
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) form.setFocus(firstError);
        releasePaymentAttempt();
        return;
      }

      setCheckoutErrors(undefined);
      setError('');

      const { latestOrder } = await flushCheckoutSync({
        includeCurrentFormDiff: true,
      });
      const total = latestOrder?.totals?.total;
      if (!latestOrder?.id || total?.value == null || !total.currencyCode) {
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
      const orderId = authorization?.fundingSource?.paymentReference;
      const publicToken = authorization?.references?.find(
        reference => reference.type === 'MERCHANT_PUBLIC_KEY'
      )?.value;
      const Razorpay = getRazorpayConstructor();
      if (
        !orderId?.startsWith('order_') ||
        !publicToken ||
        !isRazorpayLoaded ||
        !Razorpay
      ) {
        throw new Error('Razorpay Checkout configuration is unavailable');
      }

      const widget = new Razorpay({
        key: publicToken,
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
            setIsWidgetOpen(false);
            releasePaymentAttempt();
          },
        },
      });
      widget.on('payment.failed', handlePaymentFailure);

      setIsWidgetOpen(true);
      widget.open();
    } catch (err: unknown) {
      setIsWidgetOpen(false);
      releasePaymentAttempt();
      if (err instanceof GraphQLErrorWithCodes) {
        setCheckoutErrors(err.codes);
      } else {
        setError(t.errors.errorProcessingPayment);
      }
    }
  };

  const isBusy =
    isPaymentDisabled ||
    isAttempting ||
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
        disabled={isBusy || !isRazorpayLoaded}
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
