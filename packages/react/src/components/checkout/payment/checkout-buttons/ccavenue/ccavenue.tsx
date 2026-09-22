'use client';

import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { useAuthorizeCheckout } from '@/components/checkout/payment/utils/use-authorize-checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useDraftOrderShippingMethods } from '@/components/checkout/shipping/utils/use-draft-order-shipping-methods';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import {
  clearRedirectTipAmount,
  setRedirectTipAmount,
} from '@/lib/redirect-tip-storage';
import { cn } from '@/lib/utils';
import { PaymentMethodType } from '@/types';

const CCAVENUE_PROD_URL =
  'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
const CCAVENUE_TEST_URL =
  'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction';

export function CCAvenueCheckoutButton() {
  const { t, apiHost } = useGoDaddyContext();
  const { session, setCheckoutErrors, isConfirmingCheckout, ccavenueConfig } =
    useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const form = useFormContext();
  const flushCheckoutSync = useFlushCheckoutSync();
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

    await flushCheckoutSync();

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
        // No redirect will happen, so a tip left from an earlier attempt would
        // only sit there until it expired.
        if (session?.id) {
          clearRedirectTipAmount(session.id);
        }
        setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
        return;
      }

      // The tip the authorization sent, not a second read of the form, which
      // could have moved while its flush settled. Still before the redirect:
      // nothing is charged until the form below submits, so failing here costs
      // nothing.
      if (session?.enableTips && session?.id) {
        const tipAmount = resData?.authorizedTipAmount ?? 0;
        const saveResult = setRedirectTipAmount(session.id, tipAmount);

        // A lost zero tip changes nothing, since the API also treats a missing
        // tip as zero. A shadowed one does: the return leg can find an earlier
        // attempt's amount and confirm that instead.
        if (
          saveResult === 'shadowed' ||
          (saveResult === 'lost' && tipAmount > 0)
        ) {
          clearRedirectTipAmount(session.id);
          setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
          return;
        }
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
      if (session?.id) {
        clearRedirectTipAmount(session.id);
      }
      if (err instanceof GraphQLErrorWithCodes) {
        setCheckoutErrors(err.codes);
      } else {
        setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
      }
    }
  }, [
    form,
    flushCheckoutSync,
    isShipping,
    isShippingMethodsLoading,
    hasShippingMethods,
    authorizeCheckout.mutateAsync,
    setCheckoutErrors,
    ccavenueConfig?.accessCodeId,
    redirectUrl,
    session?.enableTips,
    session?.id,
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
