'use client';

import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import { useAuthorizeCheckout } from '@/components/checkout/payment/utils/use-authorize-checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useDraftOrderShippingMethods } from '@/components/checkout/shipping/utils/use-draft-order-shipping-methods';
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

  const deliveryMethod = form.watch('deliveryMethod');
  const isShipping = deliveryMethod === DeliveryMethods.SHIP;
  const { data: shippingMethodsData, isLoading: isShippingMethodsLoading } =
    useDraftOrderShippingMethods();
  const hasShippingMethods = (shippingMethodsData?.length ?? 0) > 0;

  // Same pattern as Square CDN in use-load-square: choose gateway URL by environment
  const redirectUrl =
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

    if (isShipping && (isShippingMethodsLoading || !hasShippingMethods)) {
      setCheckoutErrors(['SHIPPING_METHOD_NOT_FOUND']);
      return;
    }

    try {
      const resData = await authorizeCheckout.mutateAsync({
        paymentType: PaymentMethodType.CCAVENUE,
        paymentProvider: PaymentProvider.CCAVENUE,
        paymentToken: '',
      });
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
      Object.keys(fields).forEach(key => {
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
    isShipping,
    isShippingMethodsLoading,
    hasShippingMethods,
    authorizeCheckout.mutateAsync,
    setCheckoutErrors,
    ccavenueConfig?.accessCodeId,
    redirectUrl,
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
      {t.payment.methods.ccavenue}
    </Button>
  );
}
