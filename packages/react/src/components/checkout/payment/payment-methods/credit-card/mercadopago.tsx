import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import { useMercadoPago } from '@/components/checkout/payment/utils/mercadopago-provider';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useLoadMercadoPago } from '@/components/checkout/payment/utils/use-load-mercadopago';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import { PaymentMethodType } from '@/types';

export function MercadoPagoCreditCardForm() {
  const { t } = useGoDaddyContext();
  const { mercadoPagoConfig, setCheckoutErrors } = useCheckoutContext();
  const { data: totals } = useDraftOrderTotals();
  const form = useFormContext();
  const {
    mpInstance,
    setMpInstance,
    bricksBuilder,
    setBricksBuilder,
    setIsLoading: setMercadoPagoLoading,
  } = useMercadoPago();
  const { isMercadoPagoLoaded } = useLoadMercadoPago();
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const brickControllerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const hasRenderedRef = useRef(false);
  const onReadyRef = useRef<() => void>();
  const onSubmitRef = useRef<(args: any) => void>();
  const onErrorRef = useRef<(err: any) => void>();

  const confirmCheckout = useConfirmCheckout();

  // Memoize brick callbacks to prevent recreating the brick on every render
  const handleReady = useCallback(() => {
    setMercadoPagoLoading(false);
  }, [setMercadoPagoLoading]);

  const handleSubmit = useCallback(
    async ({ formData }: any) => {
      setMercadoPagoLoading(true);

      // Validate form before processing payment
      const valid = await form.trigger();
      if (!valid) {
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          form.setFocus(firstError);
        }
        setMercadoPagoLoading(false);
        return;
      }

      // Track MercadoPago click
      track({
        eventId: eventIds.mercadopagoClick,
        type: TrackingEventType.CLICK,
        properties: {
          paymentType: PaymentMethodType.MERCADOPAGO,
        },
      });

      try {
        // MercadoPago SDK provides the payment token in formData.token
        const paymentToken = formData?.token;

        if (!paymentToken) {
          throw new Error('No payment token received from MercadoPago');
        }

        await confirmCheckout.mutateAsync({
          paymentToken,
          paymentType: PaymentMethodType.MERCADOPAGO,
          paymentProvider: PaymentProvider.MERCADOPAGO,
        });
        setError('');
      } catch (err: unknown) {
        if (err instanceof GraphQLErrorWithCodes) {
          setCheckoutErrors(err.codes);
        } else {
          setError(t.errors.errorProcessingPayment);
        }
      } finally {
        setMercadoPagoLoading(false);
      }
    },
    [
      form,
      confirmCheckout,
      setCheckoutErrors,
      setMercadoPagoLoading,
      t.errors.errorProcessingPayment,
    ]
  );

  const handleError = useCallback(
    (err: any) => {
      const _errorMessage = err?.message || err?.error || 'Unknown error';
      setError(t.errors.errorProcessingPayment);
      setMercadoPagoLoading(false);
    },
    [setMercadoPagoLoading, t.errors.errorProcessingPayment]
  );

  useEffect(() => {
    onReadyRef.current = handleReady;
    onSubmitRef.current = handleSubmit;
    onErrorRef.current = handleError;
  }, [handleReady, handleSubmit, handleError]);

  // Initialize MercadoPago instance
  useLayoutEffect(() => {
    if (
      !isMercadoPagoLoaded ||
      !mercadoPagoConfig?.publicKey ||
      mpInstance ||
      isInitialized
    )
      return;

    try {
      const mp = new (window as any).MercadoPago(mercadoPagoConfig.publicKey);
      const builder = mp.bricks();
      setMpInstance(mp);
      setBricksBuilder(builder);
      setIsInitialized(true);
    } catch (_err) {
      setError(t.errors.errorProcessingPayment);
    }
  }, [
    isMercadoPagoLoaded,
    mercadoPagoConfig?.publicKey,
    mpInstance,
    isInitialized,
    setMpInstance,
    setBricksBuilder,
  ]);

  // Render Payment Brick
  useLayoutEffect(() => {
    if (
      !bricksBuilder ||
      brickControllerRef.current ||
      isInitializingRef.current ||
      hasRenderedRef.current
    )
      return;

    const renderBrick = async () => {
      const total = totals?.total?.value || 0;

      try {
        isInitializingRef.current = true;
        hasRenderedRef.current = true;
        const container = document.getElementById(
          'mercadopago-brick-container'
        );
        if (container) {
          container.innerHTML = '';
        }
        const settings = {
          initialization: {
            amount: total,
            payer: { email: 'dummy@testuser.com' },
          },
          customization: {
            visual: {
              style: {
                theme: 'default',
              },
            },
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              maxInstallments: 1,
            },
          },
          callbacks: {
            onReady: () => onReadyRef.current?.(),
            onSubmit: (args: any) => onSubmitRef.current?.(args),
            onError: (err: any) => onErrorRef.current?.(err),
          },
        };

        const controller = await bricksBuilder.create(
          'cardPayment',
          'mercadopago-brick-container',
          settings
        );
        brickControllerRef.current = controller;
        isInitializingRef.current = false;
      } catch (_err) {
        setError(t.errors.errorProcessingPayment);
        isInitializingRef.current = false;
        hasRenderedRef.current = false;
      }
    };

    renderBrick();
  }, [bricksBuilder]);

  // Unmount MercadoPago brick on component unmount only
  useEffect(() => {
    return () => {
      if (brickControllerRef.current) {
        try {
          brickControllerRef.current.unmount();
        } catch (_e) {
          // Ignore unmount errors
        }
        brickControllerRef.current = null;
      }
      const container = document.getElementById('mercadopago-brick-container');
      if (container) {
        container.innerHTML = '';
      }
      isInitializingRef.current = false;
    };
  }, []);

  return (
    <>
      <div id='mercadopago-brick-container' />
      {error ? (
        <p className='text-[0.8rem] font-medium text-destructive'>{error}</p>
      ) : null}
    </>
  );
}
