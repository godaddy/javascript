import { LoaderCircle } from 'lucide-react';
import React, { useCallback, useLayoutEffect, useState } from 'react';
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
import { PaymentMethodType } from '@/types';

// Module-level singletons to prevent multiple SDK/brick instantiations
let mpInstance: any = null;
let bricksBuilderInstance: any = null;
let brickController: any = null;
let brickCreationPromise: Promise<any> | null = null;
let isSubmitting = false;

function getMercadoPagoInstance(publicKey: string) {
  if (!mpInstance) {
    mpInstance = new (window as any).MercadoPago(publicKey);
    bricksBuilderInstance = mpInstance.bricks();
  }
  return { mpInstance, bricksBuilderInstance };
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [isBrickReady, setIsBrickReady] = useState(!!brickController);
  const elementId = 'mercadopago-brick-container';

  const handleSubmit = useCallback(
    async ({ formData }: any) => {
      isSubmitting = true;

      const valid = await form.trigger();
      if (!valid) {
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          form.setFocus(firstError);
        }
        isSubmitting = false;
        return;
      }

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
        isSubmitting = false;
      }
    },
    [confirmCheckout, form, setCheckoutErrors, t.errors.errorProcessingPayment]
  );

  useLayoutEffect(() => {
    const canInitialize = isMercadoPagoLoaded && mercadoPagoConfig?.publicKey;

    if (canInitialize) {
      if (brickController) {
        // Brick already exists, just mark as ready
        setIsBrickReady(true);
      } else if (brickCreationPromise) {
        // Brick creation in progress, wait for it
        brickCreationPromise.then(() => setIsBrickReady(true));
      } else {
        // Create new brick
        const renderBrick = async () => {
          const total = totals?.total?.value || 0;

          try {
            const container = document.getElementById(elementId);
            if (container) {
              container.innerHTML = '';
            }

            const { bricksBuilderInstance: bricksBuilder } =
              getMercadoPagoInstance(mercadoPagoConfig.publicKey);

            brickController = await bricksBuilder.create('payment', elementId, {
              initialization: {
                amount: total,
                payer: { email: 'dummy@testuser.com' },
              },
              customization: {
                visual: {
                  hideFormTitle: true,
                  hidePaymentButton: true,
                  style: { theme: 'default' },
                },
                paymentMethods: {
                  creditCard: 'all',
                  debitCard: 'all',
                  maxInstallments: 1,
                },
              },
              callbacks: {
                onReady: () => {
                  setIsLoading(false);
                  const brickContainer = document.getElementById(elementId);
                  const formElement = brickContainer?.querySelector('form');
                  if (formElement) {
                    formElement.style.padding = '0';
                    const childDiv = formElement.querySelector(':scope > div');
                    if (childDiv instanceof HTMLElement) {
                      childDiv.style.margin = '0';
                    }
                  }
                },
                onError: () => {
                  setError(t.errors.errorProcessingPayment);
                  setIsLoading(false);
                },
              },
            });

            setIsBrickReady(true);
          } catch (_err) {
            setError(t.errors.errorProcessingPayment);
            setIsBrickReady(false);
            brickCreationPromise = null;
          }
        };

        brickCreationPromise = renderBrick();
        brickCreationPromise.finally(() => {
          brickCreationPromise = null;
        });
      }
    }

    return () => {
      // Don't unmount if submitting (parent replaces component with loading button)
      // or if creation is in progress (React Strict Mode double-invocation)
      if (brickController && !brickCreationPromise && !isSubmitting) {
        try {
          brickController.unmount();
        } catch (_e) {
          // Ignore unmount errors
        }
        brickController = null;
      }
    };
  }, [
    isMercadoPagoLoaded,
    mercadoPagoConfig?.publicKey,
    elementId,
    t.errors.errorProcessingPayment,
  ]);

  const handleClick = async () => {
    const valid = await form.trigger();
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
      return;
    }

    if (brickController) {
      const { formData } = await brickController.getFormData();
      await handleSubmit({ formData });
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <div id={elementId} />
      {error ? (
        <p className='text-[0.8rem] font-medium text-destructive'>{error}</p>
      ) : null}
      {!isConfirmingCheckout ? (
        <Button
          className='w-full mt-4'
          size='lg'
          type='button'
          onClick={handleClick}
          disabled={isPaymentDisabled || isLoading || !isBrickReady}
        >
          {t.payment.payNow}
        </Button>
      ) : (
        <Button
          type='button'
          size='lg'
          className='w-full flex items-center justify-center gap-2 px-8 h-13 mt-4'
          disabled
        >
          <LoaderCircle className='h-5 w-5 animate-spin' />
          {t.payment.processingPayment}
        </Button>
      )}
    </div>
  );
}
