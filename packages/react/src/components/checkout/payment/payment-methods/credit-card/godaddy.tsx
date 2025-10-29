import { useLayoutEffect, useRef, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import type { TokenizeJs, TokenizeJsEvent } from '@/components/checkout/payment/types';
import { usePoyntCollect } from '@/components/checkout/payment/utils/poynt-provider';
import { PaymentProvider, useConfirmCheckout } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useLoadPoyntCollect } from '@/components/checkout/payment/utils/use-load-poynt-collect';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { PaymentMethodType } from '@/types';

export function GoDaddyCreditCardForm() {
  const { t } = useGoDaddyContext();
  const { setCollect, setIsLoadingNonce } = usePoyntCollect();
  const { isPoyntLoaded } = useLoadPoyntCollect();
  const { godaddyPaymentsConfig, setCheckoutErrors } = useCheckoutContext();
  const [error, setError] = useState('');

  const confirmCheckout = useConfirmCheckout();

  const options = {
    iFrame: {
      width: '100%',
      height: '115px',
    },
    displayComponents: {
      labels: true,
      firstName: false,
      lastName: false,
      zipCode: false,
      line1: false,
      city: false,
      territory: false,
      cvcIcon: true,
    },
    customCss: {
      inputLabel: 'display: none',
      inputDefault: `
					display: flex;
					height: 48px;
					width: 100%;
					border-radius: 0.4375rem; /* var(--radius-md): calc(0.625rem - 2px) ≈ 0.4375rem */
					border: 1px solid oklch(0.9 0.025 245);
					background: oklch(1 0 0);
					padding-left: 12px;
					padding-right: 12px;
					padding-top: 8px;
					padding-bottom: 8px;
					font-size: 14px;
					line-height: 1.5;
					color: oklch(0.13 0 0);
					font-family: "GD Sherpa", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
					transition: color 0.2s, background 0.2s, border-color 0.2s;
					
					&::placeholder {
					  color: oklch(0.556 0 0);
					}
					
					&:focus-visible {
					  outline: none;
					  border-color: oklch(0.57 0.22 255);
					  box-shadow: 0px 0px 0px 2px oklch(0.57 0.22 255) inset;
					}
					
					&:disabled {
					  cursor: not-allowed;
					  opacity: 0.5;
					}
					
					/* File input styles */
					&::file-selector-button {
					  border: 0;
					  background: transparent;
					  font-size: 14px;
					  font-weight: 500;
					  color: oklch(0.13 0 0);
					}
				`,
      cardIcon: `
					left: auto !important;
					right: 8px;
					width: 30px;
					height: 20px;
				  `,
      cvcIcon: `
					left: auto !important;
					right: 8px;
					width: 30px;
					height: 20px;
				  `,
      container: `
				  height: 100%;
				  display: grid;
				  grid-template-columns: 1fr 1fr;
				  gap: 4px;
				`,
      rowCardNumber: `
				  grid-column: 1 / span 2;
				  padding: 0;
				  margin: 0;
				`,
      rowExpiration: `
				  grid-column: 1;
				  padding: 0;
				  order: 4;
				`,
      rowCVV: `
				  grid-column: 2;
				  padding: 0;
				  order: 5;
				`,
      input: {
        cardPayment: {
          cardNumber: `
							padding: 16px;
							padding-left: 16px !important;
							padding-right: 38px;
							display: flex;
							height: 48px;
							width: 100%;
							font-size: 14px;
							border-radius: 0.4375rem; /* var(--radius-md): calc(0.625rem - 2px) ≈ 0.4375rem */
							border: 1px solid oklch(0.9 0.025 245);
							background: oklch(1 0 0);
							line-height: 1.5;
							color: oklch(0.13 0 0);
							font-family: "GD Sherpa", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
							transition: color 0.2s, background 0.2s, border-color 0.2s;
							
							&::placeholder {
							  color: oklch(0.556 0 0);
							}
							
							&:focus-visible {
							  outline: none;
							  border-color: oklch(0.57 0.22 255);
							  box-shadow: 0px 0px 0px 2px oklch(0.57 0.22 255) inset;
							}
							
							&:disabled {
							  cursor: not-allowed;
							  opacity: 0.5;
							}
						  `,
          cvc: `
							padding: 16px;
							padding-left: 16px !important;
							padding-right: 38px;
							display: flex;
							height: 48px;
							width: 100%;
							font-size: 14px;
							border-radius: 0.4375rem; /* var(--radius-md): calc(0.625rem - 2px) ≈ 0.4375rem */
							border: 1px solid oklch(0.9 0.025 245);
							background: oklch(1 0 0);
							line-height: 1.5;
							color: oklch(0.13 0 0);
							font-family: "GD Sherpa", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
							transition: color 0.2s, background 0.2s, border-color 0.2s;
							
							&::placeholder {
							  color: oklch(0.556 0 0);
							}
							
							&:focus-visible {
							  outline: none;
							  border-color: oklch(0.57 0.22 255);
							  box-shadow: 0px 0px 0px 2px oklch(0.57 0.22 255) inset;
							}
							
							&:disabled {
							  cursor: not-allowed;
							  opacity: 0.5;
							}
						  `,
        },
      },
    },
  };

  const collect = useRef<TokenizeJs | null>(null);

  useLayoutEffect(() => {
    if (!isPoyntLoaded || !godaddyPaymentsConfig || collect.current) return;

    collect.current = new (window as any).TokenizeJs(godaddyPaymentsConfig?.businessId, godaddyPaymentsConfig?.appId);

    collect?.current?.on('ready', () => {
      setCollect(collect.current);
    });

    collect?.current?.mount('gdpay-card-element', document, options);

    collect?.current?.on('nonce', async (event: TokenizeJsEvent) => {
      const nonce = event?.data?.nonce;

      if (nonce) {
        try {
          await confirmCheckout.mutateAsync({
            paymentToken: nonce,
            paymentType: PaymentMethodType.CREDIT_CARD,
            paymentProvider: PaymentProvider.POYNT,
          });
          setIsLoadingNonce(false);
          setError('');
        } catch (err: unknown) {
          if (err instanceof GraphQLErrorWithCodes) {
            setCheckoutErrors(err.codes);
          }
        }
      } else {
        setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
        setIsLoadingNonce(false);
      }
    });

    collect?.current?.on('error', (event: TokenizeJsEvent) => {
      setError(event?.data?.error?.message || t.errors.errorProcessingPayment);
      setIsLoadingNonce(false);
    });

    collect?.current?.on('validated', event => {
      if (event?.data?.validated) {
        setError('');
      }
    });
  }, [isPoyntLoaded, godaddyPaymentsConfig, confirmCheckout.mutateAsync, setCollect, setCheckoutErrors, t, setIsLoadingNonce]);

  return (
    <>
      <div id='gdpay-card-element' />
      {error ? <p className='text-[0.8rem] font-medium text-destructive'>{error}</p> : null}
    </>
  );
}
