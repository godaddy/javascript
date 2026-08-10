import { LoaderCircle } from 'lucide-react';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import { useAuthorizeCheckout } from '@/components/checkout/payment/utils/use-authorize-checkout';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useLoadMercadoPago } from '@/components/checkout/payment/utils/use-load-mercadopago';
import { formatCurrency } from '@/components/checkout/utils/format-currency';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { PaymentMethodType } from '@/types';

// Module-level singletons to prevent multiple SDK/brick instantiations
let mpInstance: any = null;
let bricksBuilderInstance: any = null;
let brickController: any = null;
let brickCreationPromise: Promise<any> | null = null;
let brickAmount: number | null = null;
let isSubmitting = false;

// Rebuilds re-authorize the session, so bursts of tip changes are coalesced.
const BRICK_REBUILD_DEBOUNCE_MS = 400;

// The debounced rebuild is held at module scope alongside the brick it replaces,
// so a pay click that lands mid-debounce can run it immediately instead of
// waiting out the remaining delay.
let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRebuild: (() => void) | null = null;

function cancelPendingRebuild() {
  if (rebuildTimer) {
    clearTimeout(rebuildTimer);
    rebuildTimer = null;
  }
  pendingRebuild = null;
}

/**
 * Start a debounced rebuild now rather than waiting out the delay.
 *
 * @returns true when a rebuild was pending and has been started.
 */
function flushPendingRebuild(): boolean {
  if (!pendingRebuild) return false;

  const startNow = pendingRebuild;
  cancelPendingRebuild();
  startNow();

  return true;
}

function getMercadoPagoInstance(publicKey: string) {
  if (!mpInstance) {
    mpInstance = new (window as any).MercadoPago(publicKey);
    bricksBuilderInstance = mpInstance.bricks();
  }
  return { mpInstance, bricksBuilderInstance };
}

function unmountBrick() {
  if (!brickController) return;

  try {
    brickController.unmount();
  } catch (_e) {
    // Ignore unmount errors
  }
  brickController = null;
  brickAmount = null;
}

export function MercadoPagoCheckoutButton() {
  const { t } = useGoDaddyContext();
  const {
    mercadoPagoConfig,
    setCheckoutErrors,
    isConfirmingCheckout,
    session,
  } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const { data: totals } = useDraftOrderTotals();
  const form = useFormContext();
  const flushCheckoutSync = useFlushCheckoutSync();
  const { isMercadoPagoLoaded } = useLoadMercadoPago();
  const confirmCheckout = useConfirmCheckout();
  const authorizeCheckout = useAuthorizeCheckout();

  const [error, setError] = useState('');
  const [isBrickReady, setIsBrickReady] = useState(false);
  const [brickRevision, setBrickRevision] = useState(0);
  const elementId = 'mercadopago-brick-container';

  const tipAmount = form.watch('tipAmount');
  // The tip the brick amount below is derived from. `useAuthorizeCheckout` reads
  // the tip from form state itself, so the brick is kept in step by rebuilding it
  // whenever this changes rather than by passing the amount through.
  const brickTipAmount = session?.enableTips ? tipAmount || 0 : 0;
  const rawAmount = parseFloat(
    formatCurrency({
      amount: (totals?.total?.value || 0) + brickTipAmount,
      currencyCode: totals?.total?.currencyCode || 'USD',
      inputInMinorUnits: true,
      returnRaw: true,
    })
  );
  const amount = Number.isFinite(rawAmount) ? rawAmount : 0;

  const amountRef = useRef(amount);
  amountRef.current = amount;

  // Whether this checkout has built a brick before. Tracked per instance rather
  // than read off `brickController`, which an earlier rebuild may have cleared.
  const hasBuiltBrickRef = useRef(false);

  const getPreferenceId = async () => {
    const response = await authorizeCheckout.mutateAsync({
      paymentToken: '',
      paymentType: PaymentMethodType.MERCADOPAGO,
      paymentProvider: PaymentProvider.MERCADOPAGO,
    });
    return response?.transactionRefNum;
  };

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

      await flushCheckoutSync();

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
    [
      confirmCheckout,
      flushCheckoutSync,
      form,
      setCheckoutErrors,
      t.errors.errorProcessingPayment,
    ]
  );

  useLayoutEffect(() => {
    const canInitialize = isMercadoPagoLoaded && mercadoPagoConfig?.publicKey;

    if (canInitialize) {
      if (brickCreationPromise) {
        // Brick creation in progress, onReady/onError callbacks will handle state
      } else if (brickController && brickAmount === amount) {
        // Brick already exists for this amount, onReady callback will mark as ready
        setIsBrickReady(true);
      } else {
        const isRebuild = hasBuiltBrickRef.current;

        setIsBrickReady(false);
        unmountBrick();

        // Create new brick
        const renderBrick = async () => {
          const total = amount;
          // Scoped to this attempt. `brickController` is only assigned once
          // `create` resolves, so it reads as "not ready" for the whole build —
          // which made every rebuild reopen the window where a card validation
          // error looked like an initialization failure.
          let becameReady = false;

          try {
            const container = document.getElementById(elementId);
            if (container) {
              container.innerHTML = '';
            }

            const { bricksBuilderInstance: bricksBuilder } =
              getMercadoPagoInstance(mercadoPagoConfig.publicKey);

            const mercadoPagoPreferenceId = await getPreferenceId();

            const controller = await bricksBuilder.create(
              'payment',
              elementId,
              {
                initialization: {
                  amount: total,
                  preferenceId: mercadoPagoPreferenceId,
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
                    becameReady = true;
                    setIsBrickReady(true);
                    const brickContainer = document.getElementById(elementId);
                    const formElement = brickContainer?.querySelector('form');
                    if (formElement) {
                      formElement.style.padding = '0';
                      const childDiv =
                        formElement.querySelector(':scope > div');
                      if (childDiv instanceof HTMLElement) {
                        childDiv.style.margin = '0';
                      }
                    }
                  },
                  onError: () => {
                    // Only treat as initialization failure if the brick never became ready.
                    // Card validation errors are handled by the brick's own UI.
                    if (!becameReady) {
                      setError(t.errors.failedToInitializePayment);
                      setIsBrickReady(false);
                    }
                  },
                },
              }
            );

            brickController = controller;
            brickAmount = total;
          } catch (_err) {
            setError(t.errors.failedToInitializePayment);
            setIsBrickReady(false);
            brickCreationPromise = null;
          }
        };

        const startBrickCreation = () => {
          hasBuiltBrickRef.current = true;
          brickCreationPromise = renderBrick();
          brickCreationPromise.finally(() => {
            brickCreationPromise = null;
            if (brickController && brickAmount !== amountRef.current) {
              setBrickRevision(revision => revision + 1);
            }
          });
        };

        if (isRebuild) {
          // Every rebuild authorizes the session again to get a fresh
          // preference, so coalesce bursts of tip changes into one rebuild
          // instead of one per tap. The button is already disabled above.
          cancelPendingRebuild();
          pendingRebuild = startBrickCreation;
          rebuildTimer = setTimeout(() => {
            cancelPendingRebuild();
            startBrickCreation();
          }, BRICK_REBUILD_DEBOUNCE_MS);
        } else {
          startBrickCreation();
        }
      }
    }

    return () => {
      cancelPendingRebuild();
      // Don't unmount if submitting (parent replaces component with loading button)
      // or if creation is in progress (React Strict Mode double-invocation)
      if (brickController && !brickCreationPromise && !isSubmitting) {
        unmountBrick();
      }
    };
  }, [
    isMercadoPagoLoaded,
    mercadoPagoConfig?.publicKey,
    elementId,
    // `brickTipAmount` is deliberately absent: `amount` is derived from it, so
    // it cannot change without changing this.
    amount,
    brickRevision,
    t.errors.failedToInitializePayment,
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

    await flushCheckoutSync();

    if (brickController && brickAmount === amountRef.current) {
      const { formData } = await brickController.getFormData();
      await handleSubmit({ formData });
    } else {
      // The amount moved while this click awaited validation and the sync flush,
      // so the brick that would tokenize the card is for the wrong total. It has
      // to be rebuilt — and rebuilt empty, so there is nothing to submit on the
      // customer's behalf. Start that now rather than leaving them waiting out
      // the debounce for a form to come back.
      setIsBrickReady(false);
      if (!flushPendingRebuild()) {
        setBrickRevision(revision => revision + 1);
      }
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
          disabled={
            isPaymentDisabled || authorizeCheckout.isPending || !isBrickReady
          }
        >
          {authorizeCheckout.isPending && !error ? (
            <>
              <LoaderCircle className='h-5 w-5 animate-spin' />
              {t.payment.payNow}
            </>
          ) : (
            t.payment.payNow
          )}
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
