import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import type {
  TokenizeJs,
  TokenizeJsEvent,
} from '@/components/checkout/payment/types';
import { usePoyntACHCollect } from '@/components/checkout/payment/utils/poynt-ach-provider';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useLoadPoyntCollect } from '@/components/checkout/payment/utils/use-load-poynt-collect';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { PaymentMethodType } from '@/types';

export function GoDaddyACHForm() {
  const { t } = useGoDaddyContext();
  const { session } = useCheckoutContext();
  const { setCollect, setIsLoadingNonce } = usePoyntACHCollect();
  const { isPoyntLoaded } = useLoadPoyntCollect();
  const { godaddyPaymentsConfig, setCheckoutErrors } = useCheckoutContext();
  const [error, setError] = useState('');

  const confirmCheckout = useConfirmCheckout();

  const elementId = `gdpay-ach-element-${useId()}`;

  const fontFamily =
    '"GD Sherpa", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

  const baseInputStyle = `
    display: flex;
    height: 48px;
    width: 100%;
    border-radius: 0.4375rem;
    border: 1px solid oklch(0.9 0.025 245);
    background: oklch(1 0 0);
    padding-left: 12px;
    padding-right: 12px;
    padding-top: 8px;
    padding-bottom: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: oklch(0.13 0 0);
    font-family: ${fontFamily};
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
  `;

  const options = {
    iFrame: {
      width: '100%',
      height: '360px',
      border: '0px',
    },
    paymentMethods: ['ach'],
    displayComponents: {
      labels: true,
    },
    customCss: {
      container: `
        --collect-radio-size: 16px;
        --collect-radio-dot-size: 7px;
        --collect-radio-checked-bg-color: oklch(0.8 0.17 185);
        --collect-radio-border-color: oklch(0.9 0.025 245);
        --collect-radio-dot-color: oklch(0.13 0 0);
        --collect-radio-bg-color: oklch(1 0 0);
        --collect-border-radius-round: 50%;
        --collect-spacing-lg: 10px;
        --collect-spacing-md: 8px;
        font-family: ${fontFamily};
      `,

      rowAccountHolderName: `
        flex: 1 1 100%;
        padding: 0;
        margin: 0;
        margin-bottom: 16px;
      `,
      rowAccountHolderType: `
        flex: 1 1 100%;
        padding: 0;
        margin: 0;
        margin-bottom: 16px;
      `,
      rowRoutingNumber: `
        flex: 1 1 100%;
        padding: 0;
        margin: 0;
      `,
      rowBankAccountNumber: `
        flex: 1 1 100%;
        padding: 0;
        margin: 0;
        padding-top: 16px;
      `,

      radio: {
        accountHolderType: {
          label: `
            font-size: 14px;
            font-weight: 500;
            line-height: 1.5;
            color: oklch(0.13 0 0);
            cursor: pointer;`,
          container: `
            display: inline-flex;
            margin-right: 24px;
            margin-bottom: 0px;

            .poynt-collect-payment-radio-input:checked + .poynt-collect-payment-radio-label::after {
              left: 5.5px;
              top: 9px;
            }
          `,
        },
      },

      input: {
        ownerName: baseInputStyle,
        routingNumber: baseInputStyle,
        accountNumber: baseInputStyle,
      },
    },
  };

  const collect = useRef<TokenizeJs | null>(null);

  useLayoutEffect(() => {
    if (
      !isPoyntLoaded ||
      !godaddyPaymentsConfig ||
      collect.current ||
      (!godaddyPaymentsConfig?.businessId && !session?.businessId)
    )
      return;

    collect.current = new (window as any).TokenizeJs({
      businessId: godaddyPaymentsConfig?.businessId || session?.businessId,
      storeId: session?.storeId,
      channelId: session?.channelId,
      applicationId: godaddyPaymentsConfig?.appId,
    });

    collect?.current?.on('ready', () => {
      setCollect(collect.current);
    });

    collect?.current?.mount(elementId, document, options);

    collect?.current?.on('nonce', async (event: TokenizeJsEvent) => {
      const nonce = event?.data?.nonce;

      if (nonce) {
        try {
          await confirmCheckout.mutateAsync({
            paymentToken: nonce,
            paymentType: PaymentMethodType.ACH,
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
  }, [
    isPoyntLoaded,
    godaddyPaymentsConfig,
    confirmCheckout.mutateAsync,
    setCollect,
    setCheckoutErrors,
    t,
    setIsLoadingNonce,
    session?.businessId,
    session?.storeId,
    session?.channelId,
  ]);

  return (
    <>
      <div id={elementId} />
      {error ? (
        <p className='text-[0.8rem] font-medium text-destructive'>{error}</p>
      ) : null}
    </>
  );
}
