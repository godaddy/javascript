'use client';

import {
  PayPalCardFieldsForm,
  PayPalCardFieldsProvider,
  usePayPalCardFields,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import { useEffect } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { usePayPalProvider } from '@/components/checkout/payment/utils/paypal-provider';
import { useAuthorizeCheckout } from '@/components/checkout/payment/utils/use-authorize-checkout';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { PaymentMethodType } from '@/types';

function parsePayPalSubmissionError(error: any, t: any): string {
  if (error && typeof error === 'object') {
    if (error?.message?.includes('INVALID_NUMBER')) {
      return t.validation.invalidCardNumber;
    }
    if (error?.message?.includes('INVALID_EXPIRY')) {
      return t.validation.invalidExpiry;
    }
    if (error?.message?.includes('INVALID_CVV')) {
      return t.validation.invalidCvv;
    }
  }
  return t.validation.paymentSubmissionFailed;
}

function PayPalCardFieldsFormContent() {
  const {
    setIsCardFieldsReady,
    setCardFieldsError,
    cardFieldsRef,
    fieldValidationErrors,
    cardFieldsError,
  } = usePayPalProvider();
  const { cardFieldsForm } = usePayPalCardFields();
  const [{ isResolved, isPending }] = usePayPalScriptReducer();
  const { t } = useGoDaddyContext();

  useEffect(() => {
    if (!cardFieldsForm) return;

    cardFieldsRef.current = {
      submit: async () => {
        try {
          await cardFieldsForm.submit();
        } catch (error) {
          // Parse PayPal specific errors
          const errorMessage = parsePayPalSubmissionError(error, t);
          setCardFieldsError(errorMessage);
          throw error;
        }
      },
      isEligible: () => !!cardFieldsForm,
    };

    setIsCardFieldsReady(true);
    setCardFieldsError(null);

    return () => {
      setIsCardFieldsReady(false);
      cardFieldsRef.current = null;
    };
  }, [
    cardFieldsForm,
    setIsCardFieldsReady,
    setCardFieldsError,
    cardFieldsRef,
    t,
  ]);

  if (isPending || !isResolved) {
    return <Skeleton className='h-10 w-full' />;
  }

  return (
    <div className='space-y-4'>
      <PayPalCardFieldsForm className='paypal-cc-container' />

      {/* Display field validation errors */}
      {Object.entries(fieldValidationErrors).map(([field, error]) => (
        <p key={field} className='text-[0.8rem] font-medium text-destructive'>
          {error}
        </p>
      ))}
      {/* Display general submission errors */}
      {cardFieldsError && (
        <p className='text-[0.8rem] font-medium text-destructive'>
          {cardFieldsError}
        </p>
      )}
    </div>
  );
}

export function PayPalCreditCardForm() {
  const { paypalConfig, setCheckoutErrors } = useCheckoutContext();
  const { t } = useGoDaddyContext();

  const confirmCheckout = useConfirmCheckout();
  const authorizeCheckout = useAuthorizeCheckout();

  if (!paypalConfig?.clientId) {
    return (
      <div className='text-destructive'>
        {t.errors.paypalConfigMissing || 'PayPal configuration missing'}
      </div>
    );
  }

  return (
    <PayPalCardFieldsProvider
      createOrder={async () => {
        const result = await authorizeCheckout.mutateAsync({
          paymentType: PaymentMethodType.CREDIT_CARD,
          paymentProvider: PaymentProvider.PAYPAL,
        });
        return result?.id ?? '';
      }}
      onApprove={async data => {
        try {
          await confirmCheckout.mutateAsync({
            paymentToken: data.orderID,
            paymentType: PaymentMethodType.CREDIT_CARD,
            paymentProvider: PaymentProvider.PAYPAL,
          });
        } catch (error) {
          if (error instanceof GraphQLErrorWithCodes) {
            setCheckoutErrors(error.codes);
          } else {
            setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
          }
          throw error;
        }
      }}
      onError={_error => {
        // PayPal Card Fields provider error
      }}
      style={{
        '.card-field-name': {
          border: '1px solid oklch(0.9 0.025 245)',
          // @ts-ignore
          'border-radius': '0.375rem',
          'background-color': 'oklch(1 0 0)',
          padding: '0.5rem 0.75rem',
          'font-size': '0.875rem',
          'line-height': '1.25rem',
          height: '3rem',
          color: 'oklch(0.13 0 0)',
        },
        '.card-field-number': {
          // @ts-ignore
          border: '1px solid oklch(0.9 0.025 245) !important',
          // @ts-ignore
          'border-radius': '0.375rem',
          'background-color': 'oklch(1 0 0)',
          padding: '0.5rem 0.75rem',
          'font-size': '0.875rem',
          'line-height': '1.25rem',
          height: '3rem',
          color: 'oklch(0.13 0 0)',
        },
        '.card-field-expiry': {
          // @ts-ignore
          border: '1px solid oklch(0.9 0.025 245)',
          // @ts-ignore
          'border-radius': '0.375rem',
          'background-color': 'oklch(1 0 0)',
          padding: '0.5rem 0.75rem',
          'font-size': '0.875rem',
          'line-height': '1.25rem',
          height: '3rem',
          color: 'oklch(0.13 0 0)',
        },
        '.card-field-cvv': {
          border: '1px solid oklch(0.9 0.025 245)',
          // @ts-ignore
          'border-radius': '0.375rem',
          'background-color': 'oklch(1 0 0)',
          padding: '0.5rem 0.75rem',
          'font-size': '0.875rem',
          'line-height': '1.25rem',
          height: '3rem',
          color: 'oklch(0.13 0 0)',
        },
        '.card-field-name:focus': {
          outline: 'none',
          // @ts-ignore
          'box-shadow': 'unset',
        },
        '.card-field-number:focus': {
          outline: 'none',
          // @ts-ignore
          'box-shadow': 'unset',
        },
        '.card-field-expiry:focus': {
          outline: 'none',
          // @ts-ignore
          'box-shadow': 'unset',
        },
        '.card-field-cvv:focus': {
          outline: 'none',
          // @ts-ignore
          'box-shadow': 'unset',
        },
        '.card-field-name.invalid': {
          // @ts-ignore
          'box-shadow': 'unset',
          border: '1px solid oklch(0.577 0.245 27.325) !important',
        },
        '.card-field-number.invalid': {
          // @ts-ignore
          'box-shadow': 'unset',
          border: '1px solid oklch(0.577 0.245 27.325) !important',
        },
        '.card-field-expiry.invalid': {
          // @ts-ignore
          'box-shadow': 'unset',
          border: '1px solid oklch(0.577 0.245 27.325) !important',
        },
        '.card-field-cvv.invalid': {
          // @ts-ignore
          'box-shadow': 'unset',
          border: '1px solid oklch(0.577 0.245 27.325) !important',
        },
        '.card-field-name.invalid:focus': {
          outline: 'none',
          // @ts-ignore
          'box-shadow': 'unset',
        },
        '.card-field-number.invalid:focus': {
          outline: 'none',
          // @ts-ignore
          'box-shadow': 'unset',
        },
        '.card-field-expiry.invalid:focus': {
          outline: 'none',
          // @ts-ignore
          'box-shadow': 'unset',
        },
        '.card-field-cvv.invalid:focus': {
          outline: 'none',
          // @ts-ignore
          'box-shadow': 'unset',
        },
        '::placeholder': {
          color: 'oklch(0.556 0 0)',
        },
      }}
    >
      <PayPalCardFieldsFormContent />
    </PayPalCardFieldsProvider>
  );
}
