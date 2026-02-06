import { useLayoutEffect, useRef, useState } from 'react';
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
import { PaymentMethodType } from '@/types';

export function MercadoPagoCreditCardForm() {
  const { t } = useGoDaddyContext();
  const { mercadoPagoConfig, setCheckoutErrors } = useCheckoutContext();
  const { data: totals } = useDraftOrderTotals();
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
  const [isBrickRendered, setIsBrickRendered] = useState(false);
  const brickControllerRef = useRef<any>(null);

  const confirmCheckout = useConfirmCheckout();

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
    } catch (err) {
      console.error('Error initializing MercadoPago:', err);
      setError(t.errors.errorProcessingPayment);
    }
  }, [
    isMercadoPagoLoaded,
    mercadoPagoConfig?.publicKey,
    mpInstance,
    isInitialized,
    setMpInstance,
    setBricksBuilder,
    t.errors.errorProcessingPayment,
  ]);

  // Render Payment Brick
  useLayoutEffect(() => {
    if (
      !bricksBuilder ||
      !mercadoPagoConfig?.publicKey ||
      brickControllerRef.current ||
      isBrickRendered
    )
      return;

    const renderBrick = async () => {
      const total = totals?.total?.value || 0;

      try {
        setIsBrickRendered(true);
        const settings = {
          initialization: {
            amount: total,
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
            onReady: () => {
              setMercadoPagoLoading(false);
            },
            onSubmit: async ({ formData }: any) => {
              setMercadoPagoLoading(true);
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
            onError: (error: any) => {
              console.error('MercadoPago Brick Error:', error);
              setError(t.errors.errorProcessingPayment);
              setMercadoPagoLoading(false);
            },
          },
        };

        brickControllerRef.current = await bricksBuilder.create(
          'payment',
          'mercadopago-brick-container',
          settings
        );
      } catch (err) {
        console.error('Error rendering brick:', err);
        setError(t.errors.errorProcessingPayment);
        setIsBrickRendered(false);
      }
    };

    renderBrick();

    return () => {
      if (brickControllerRef.current) {
        try {
          brickControllerRef.current.unmount();
        } catch (e) {
          console.error('Error unmounting brick:', e);
        }
        brickControllerRef.current = null;
        setIsBrickRendered(false);
      }
    };
  }, [
    bricksBuilder,
    mercadoPagoConfig?.publicKey,
    totals?.total?.value,
    confirmCheckout,
    setCheckoutErrors,
    setMercadoPagoLoading,
    t.errors.errorProcessingPayment,
    isBrickRendered,
  ]);

  return (
    <>
      <div id="mercadopago-brick-container" />
      {error ? (
        <p className="text-[0.8rem] font-medium text-destructive">{error}</p>
      ) : null}
    </>
  );
}
