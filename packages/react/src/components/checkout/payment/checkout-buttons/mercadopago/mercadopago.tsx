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
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useLoadMercadoPago } from '@/components/checkout/payment/utils/use-load-mercadopago';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import { PaymentMethodType } from '@/types';

export function MercadoPagoCheckoutButton() {
  const { t } = useGoDaddyContext();
  const { mercadoPagoConfig, setCheckoutErrors, isConfirmingCheckout } =
    useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const { data: totals } = useDraftOrderTotals();
  const form = useFormContext();
  const { isMercadoPagoLoaded } = useLoadMercadoPago();
  const confirmCheckout = useConfirmCheckout();

  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [bricksBuilder, setBricksBuilder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrickReady, setIsBrickReady] = useState(false);
  const brickControllerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const hasRenderedRef = useRef(false);
  const onReadyRef = useRef<() => void>(null);
  const onSubmitRef = useRef<(args: any) => void>(null);
  const onErrorRef = useRef<(err: any) => void>(null);

  const handleReady = useCallback(() => {
    setIsLoading(false);

    const container = document.getElementById('mercadopago-brick-container');
    const formElement = container?.querySelector('form');
    if (formElement) {
      formElement.style.padding = '0';
      const childDiv = formElement.querySelector(':scope > div');
      if (childDiv instanceof HTMLElement) {
        childDiv.style.margin = '0';
      }
    }
  }, []);

  const handleSubmit = useCallback(
    async ({ formData }: any) => {
      setIsLoading(true);

      const valid = await form.trigger();
      if (!valid) {
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          form.setFocus(firstError);
        }
        setIsLoading(false);
        return;
      }

      track({
        eventId: eventIds.mercadopagoClick,
        type: TrackingEventType.CLICK,
        properties: {
          paymentType: PaymentMethodType.MERCADOPAGO,
        },
      });

      try {
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
        setIsLoading(false);
      }
    },
    [confirmCheckout, form, setCheckoutErrors, t.errors.errorProcessingPayment]
  );

  const handleError = useCallback(
    (err: any) => {
      const _errorMessage = err?.message || err?.error || 'Unknown error';
      setError(t.errors.errorProcessingPayment);
      setIsLoading(false);
    },
    [t.errors.errorProcessingPayment]
  );

  useEffect(() => {
    onReadyRef.current = handleReady;
    onSubmitRef.current = handleSubmit;
    onErrorRef.current = handleError;
  }, [handleReady, handleSubmit, handleError]);

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
    t.errors.errorProcessingPayment,
  ]);

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
              hideFormTitle: true,
              hidePaymentButton: true,
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
          'payment',
          'mercadopago-brick-container',
          settings
        );

        brickControllerRef.current = controller;
        setIsBrickReady(true);
        isInitializingRef.current = false;
      } catch (_err) {
        setError(t.errors.errorProcessingPayment);
        isInitializingRef.current = false;
        hasRenderedRef.current = false;
        setIsBrickReady(false);
      }
    };

    renderBrick();
  }, [bricksBuilder]);

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
      setIsBrickReady(false);
    };
  }, []);

  const handleClick = async () => {
    const valid = await form.trigger();
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
      return;
    }

    if (brickControllerRef.current && onSubmitRef.current) {
      const { formData } = await brickControllerRef.current.getFormData();
      await onSubmitRef.current({ formData });
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <div id='mercadopago-brick-container' />
      {error ? (
        <p className='text-[0.8rem] font-medium text-destructive'>{error}</p>
      ) : null}
      <Button
        className='w-full'
        size='lg'
        type='button'
        onClick={handleClick}
        disabled={
          isConfirmingCheckout ||
          isPaymentDisabled ||
          isLoading ||
          !isBrickReady
        }
      >
        {t.payment.payNow}
      </Button>
    </div>
  );
}
