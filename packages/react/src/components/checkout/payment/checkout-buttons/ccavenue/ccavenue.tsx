'use client';

import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useAuthorizeCheckout } from '@/components/checkout/payment/utils/use-authorize-checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { cn } from '@/lib/utils';
import { PaymentMethodType } from '@/types';

const CCAVENUE_PROD_URL =
  'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
const CCAVENUE_TEST_URL =
  'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction';

export function CCAvenueCheckoutButton() {
  const { t, apiHost } = useGoDaddyContext();
  const { setCheckoutErrors, isConfirmingCheckout, ccavenueConfig } =
    useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const form = useFormContext();
  const authorizeCheckout = useAuthorizeCheckout();

  // Same pattern as Square CDN in use-load-square: choose gateway URL by environment
  const ccavenueRedirectUrl =
    apiHost && !apiHost.includes('test') && !apiHost.includes('dev')
      ? CCAVENUE_PROD_URL
      : CCAVENUE_TEST_URL;

  const handleClick = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
      return;
    }

    if (!ccavenueConfig?.accessCodeId) {
      setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
      return;
    }

    const redirectUrl = ccavenueConfig.redirectURL ?? ccavenueRedirectUrl;

    try {
      const resData = await authorizeCheckout.mutateAsync({
        paymentType: PaymentMethodType.CCAVENUE,
        paymentProvider: PaymentProvider.CCAVENUE,
        paymentToken: '',
      });
      console.log('resData', resData);
      const transactionRefNum = resData?.transactionRefNum ?? '';
      if (!transactionRefNum) {
        setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
        return;
      }

      const formEl = document.createElement('form');
      formEl.method = 'POST';
      formEl.action = redirectUrl;
      const fields: Record<string, string> = {
        encRequest: transactionRefNum,
        access_code: ccavenueConfig.accessCodeId,
      };
      Object.keys(fields).forEach((key) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        formEl.appendChild(input);
      });
      document.body.appendChild(formEl);
      formEl.submit();
    } catch (err: unknown) {
      if (err instanceof GraphQLErrorWithCodes) {
        setCheckoutErrors(err.codes);
      } else {
        setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
      }
    }
  }, [
    form,
    authorizeCheckout.mutateAsync,
    setCheckoutErrors,
    ccavenueConfig?.redirectURL,
    ccavenueConfig?.accessCodeId,
    ccavenueRedirectUrl,
  ]);

  const isBusy = isConfirmingCheckout || isPaymentDisabled;

  return (
    <Button
      type='button'
      size='lg'
      className={cn('w-full')}
      disabled={isBusy}
      onClick={handleClick}
    >
      {t.payment.methods.ccavenue ?? 'Pay with CCAvenue'}
    </Button>
  );
}
