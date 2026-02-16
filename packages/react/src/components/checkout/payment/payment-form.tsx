import { Circle, CreditCard, LoaderCircle, Wallet } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useFormContext } from 'react-hook-form';
import { AddressForm } from '@/components/checkout/address';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { CheckoutSection } from '@/components/checkout/checkout-section';
import { CheckoutSectionHeader } from '@/components/checkout/checkout-section-header';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import {
  DraftOrderLineItems,
  type Product,
} from '@/components/checkout/line-items';
import ApplePayIcon from '@/components/checkout/payment/icons/ApplePay';
import GooglePayIcon from '@/components/checkout/payment/icons/GooglePay';
import PayPalIcon from '@/components/checkout/payment/icons/PayPal';
import PazeIcon from '@/components/checkout/payment/icons/Paze';
import MercadoPagoIcon from '@/components/checkout/payment/icons/MercadoPago';
import {
  hasPaymentMethodButton,
  hasPaymentMethodForm,
  PaymentMethodRenderer,
} from '@/components/checkout/payment/payment-method-renderer';
import type { TokenizeJs } from '@/components/checkout/payment/types';
import { PaymentAddressToggle } from '@/components/checkout/payment/utils/payment-address-toggle';
import { useGetSelectedPaymentMethod } from '@/components/checkout/payment/utils/use-get-selected-payment-method';
import { useLoadPoyntCollect } from '@/components/checkout/payment/utils/use-load-poynt-collect';
import { Target } from '@/components/checkout/target/target';
import {
  DraftOrderTotals,
  type DraftOrderTotalsProps,
} from '@/components/checkout/totals/totals';
import { useFormatCurrency } from '@/components/checkout/utils/format-currency';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useGoDaddyContext } from '@/godaddy-provider';
import { cn } from '@/lib/utils';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import {
  CheckoutType,
  PaymentMethodType,
  type PaymentMethodValue,
  PaymentProvider,
} from '@/types';

// UI config for payment methods (labels will be resolved from translations)
const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  card: <CreditCard className='h-5 w-5' />,
  paypal: <PayPalIcon className='h-5 w-5' />,
  applePay: <ApplePayIcon className='h-5 w-5' />,
  googlePay: <GooglePayIcon className='h-5 w-10' />,
  paze: <PazeIcon className='h-5 w-8' />,
  mercadopago: <MercadoPagoIcon className='h-5 w-8' />,
  offline: <Wallet className='h-5 w-5' />,
};

export function PaymentForm(
  props: DraftOrderTotalsProps & { items: Product[] }
) {
  const formatCurrency = useFormatCurrency();
  const { t } = useGoDaddyContext();
  const {
    session,
    isConfirmingCheckout,
    setCheckoutErrors,
    requiredFields,
    godaddyPaymentsConfig,
  } = useCheckoutContext();
  const form = useFormContext();
  const paymentMethod = form.watch('paymentMethod');
  const deliveryMethod = form.watch('deliveryMethod');
  const useShippingAddress = form.watch('paymentUseShippingAddress');
  const isPickup = deliveryMethod === DeliveryMethods.PICKUP;
  const isShipping = deliveryMethod === DeliveryMethods.SHIP;
  const methodConfig = useGetSelectedPaymentMethod(
    paymentMethod as PaymentMethodValue
  );
  const { isPoyntLoaded } = useLoadPoyntCollect();

  const [pazeSupported, setPazeSupported] = useState<boolean | null>(null);
  const collect = useRef<TokenizeJs | null>(null);

  const currencyCode = props.currencyCode || 'USD';
  const countryCode = session?.shipping?.originAddress?.countryCode || 'US';

  // Helper function to get translated payment method labels
  const getPaymentMethodLabel = useCallback(
    (key: string): string => {
      switch (key) {
        case PaymentMethodType.CREDIT_CARD:
          return t.payment.methods.creditCard;
        case PaymentMethodType.PAYPAL:
          return t.payment.methods.paypal;
        case PaymentMethodType.APPLE_PAY:
          return t.payment.methods.applePay;
        case PaymentMethodType.GOOGLE_PAY:
          return t.payment.methods.googlePay;
        case PaymentMethodType.PAZE:
          return t.payment.methods.paze;
        case PaymentMethodType.OFFLINE:
          return t.payment.methods.offline;
        case PaymentMethodType.MERCADOPAGO:
          return 'MercadoPago';
        default:
          return key;
      }
    },
    [t]
  );

  // Helper function to get translated payment method descriptions
  const getPaymentMethodDescription = useCallback(
    (key: string): string | undefined => {
      switch (key) {
        case PaymentMethodType.CREDIT_CARD:
          return t.payment.descriptions?.creditCard;
        case PaymentMethodType.PAYPAL:
          return t.payment.descriptions?.paypal;
        case PaymentMethodType.APPLE_PAY:
          return t.payment.descriptions?.applePay;
        case PaymentMethodType.GOOGLE_PAY:
          return t.payment.descriptions?.googlePay;
        case PaymentMethodType.PAZE:
          return t.payment.descriptions?.paze;
        case PaymentMethodType.OFFLINE:
          return t.payment.descriptions?.offline;
        case PaymentMethodType.MERCADOPAGO:
          return undefined;
        default:
          return undefined;
      }
    },
    [t]
  );

  // Initialize TokenizeJs for Paze with GoDaddy processor
  useLayoutEffect(() => {
    if (
      !collect.current &&
      godaddyPaymentsConfig &&
      (godaddyPaymentsConfig?.businessId || session?.businessId) &&
      isPoyntLoaded &&
      countryCode &&
      currencyCode &&
      session?.paymentMethods?.paze?.processor === PaymentProvider.GODADDY
    ) {
      collect.current = new (window as any).TokenizeJs(
        {
          businessId: godaddyPaymentsConfig?.businessId || session?.businessId,
          storeId: session?.storeId,
          channelId: session?.channelId,
          applicationId: godaddyPaymentsConfig?.appId,
        },
        {
          country: countryCode,
          currency: currencyCode,
          merchantName: session?.storeName || '',
        }
      );

      collect.current?.supportWalletPayments().then(supports => {
        if (supports.paze) {
          setPazeSupported(true);
        } else {
          setPazeSupported(false);
        }
      });
    }
  }, [
    godaddyPaymentsConfig,
    countryCode,
    currencyCode,
    session?.paymentMethods?.paze?.processor,
    session?.storeName,
    session?.businessId,
    session?.storeId,
    session?.channelId,
    isPoyntLoaded,
  ]);

  const availablePaymentMethods = React.useMemo(() => {
    if (!session?.paymentMethods) return [];
    return Object.keys(session.paymentMethods).filter(key => {
      const method = session.paymentMethods?.[key as PaymentMethodValue];

      // Special handling for Paze with GoDaddy processor
      if (
        key === PaymentMethodType.PAZE &&
        method?.processor === PaymentProvider.GODADDY
      ) {
        return (
          PAYMENT_METHOD_ICONS[key as PaymentMethodValue] &&
          method &&
          Array.isArray(method.checkoutTypes) &&
          method.checkoutTypes.includes(CheckoutType.STANDARD) &&
          pazeSupported === true
        );
      }

      return (
        PAYMENT_METHOD_ICONS[key as PaymentMethodValue] &&
        method &&
        Array.isArray(method.checkoutTypes) &&
        method.checkoutTypes.includes(CheckoutType.STANDARD)
      );
    });
  }, [session, pazeSupported]);

  const isBillingAddressRequired =
    session?.enableBillingAddressCollection &&
    (!useShippingAddress || isPickup) &&
    paymentMethod !== PaymentMethodType.CREDIT_CARD;

  const filteredPaymentMethods = React.useMemo(() => {
    const sortedKeys = Object.keys(PAYMENT_METHOD_ICONS)
      .filter(key => availablePaymentMethods.includes(key))
      .sort((a, b) => {
        if (a === PaymentMethodType.CREDIT_CARD) return -1;
        if (b === PaymentMethodType.CREDIT_CARD) return 1;
        return 0;
      });
    return sortedKeys.map(
      key =>
        [
          key,
          {
            label: getPaymentMethodLabel(key),
            icon: PAYMENT_METHOD_ICONS[key],
          },
        ] as const
    );
  }, [availablePaymentMethods, getPaymentMethodLabel]);

  // Only render the form for the selected payment method
  const getPaymentMethodForm = () => {
    if (!methodConfig) return null;

    const hasForm = hasPaymentMethodForm(paymentMethod, methodConfig.processor);

    if (!hasForm) return null;

    return (
      <PaymentMethodRenderer
        type='form'
        method={paymentMethod}
        provider={methodConfig.processor}
      />
    );
  };

  // Get description for payment method if it exists
  const getPaymentMethodDescriptionContent = () => {
    const description = getPaymentMethodDescription(paymentMethod);
    if (!description) return null;

    return <div>{description}</div>;
  };

  // Render the correct checkout button(s) for the selected payment method
  const getCheckoutButton = () => {
    if (isConfirmingCheckout) {
      return (
        <Button
          type='button'
          size='lg'
          className='w-full flex items-center justify-center gap-2 px-8 h-13'
          disabled
        >
          <LoaderCircle className='h-5 w-5 animate-spin' />
          {t.payment.processingPayment}
        </Button>
      );
    }

    if (!methodConfig) return null;

    const hasButton = hasPaymentMethodButton(
      paymentMethod,
      methodConfig.processor
    );

    // No button component available for this payment method
    if (!hasButton) return null;

    return (
      <PaymentMethodRenderer
        type='button'
        method={paymentMethod}
        provider={methodConfig.processor}
      />
    );
  };

  useEffect(() => {
    if (
      filteredPaymentMethods.length &&
      (!paymentMethod ||
        !filteredPaymentMethods.some(([key]) => key === paymentMethod))
    ) {
      const firstFilteredMethod = filteredPaymentMethods[0][0];
      // Set default payment method to first available method)
      form.setValue('paymentMethod', firstFilteredMethod);
    }
  }, [form, paymentMethod, filteredPaymentMethods]);

  const handleAccordionChange = async (value: string) => {
    form.setValue('paymentMethod', value, { shouldDirty: false });

    setCheckoutErrors(undefined);

    // Track payment method selection event
    track({
      eventId: eventIds.selectPaymentMethod,
      type: TrackingEventType.CLICK,
      properties: {
        paymentMethod: value,
        paymentMethodLabel: getPaymentMethodLabel(value),
      },
    });
  };

  const isSingleMethod = filteredPaymentMethods?.length === 1;
  const methodForm = getPaymentMethodForm();
  const methodDescription = getPaymentMethodDescriptionContent();
  const hasFormOrDescription = methodForm || methodDescription;

  if (filteredPaymentMethods.length === 0) {
    return <p className='text-sm'>{t.payment.noMethodsAvailable}</p>;
  }

  return (
    <div className='space-y-4'>
      {!isSingleMethod || hasFormOrDescription ? (
        <FormField
          control={form.control}
          name='paymentMethod'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormMessage />
              <FormControl>
                <Accordion
                  type='single'
                  collapsible={false}
                  value={field.value}
                  onValueChange={handleAccordionChange}
                  className='w-full border border-border rounded-md overflow-hidden'
                >
                  {filteredPaymentMethods.map(
                    ([key, { label, icon }], index, array) => {
                      return (
                        <AccordionItem
                          key={key}
                          value={key}
                          className={cn(
                            'border-0',
                            index !== array.length - 1 &&
                              'border-b border-border',
                            paymentMethod === key && 'bg-muted'
                          )}
                        >
                          <AccordionTrigger
                            hideChevron
                            className={cn(
                              'py-3 px-4 flex items-center hover:no-underline hover:bg-muted transition-colors',
                              paymentMethod === key && 'bg-muted hover:bg-muted'
                            )}
                            aria-required={requiredFields?.paymentMethod}
                            tabIndex={0}
                          >
                            <div className='flex w-full items-center'>
                              {!isSingleMethod ? (
                                <div
                                  className={cn(
                                    'aspect-square bg-input h-4 w-4 rounded-full border border-border text-accent shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mr-2 flex items-center justify-center',
                                    paymentMethod === key &&
                                      'bg-accent border-accent'
                                  )}
                                >
                                  {paymentMethod === key && (
                                    <Circle className='h-2 w-2 fill-accent-foreground' />
                                  )}
                                </div>
                              ) : null}
                              <div className='flex w-full justify-between items-center gap-3'>
                                <div className='flex flex-col'>
                                  <span
                                    className={cn(
                                      paymentMethod === key && 'font-medium'
                                    )}
                                  >
                                    {label}
                                  </span>
                                </div>
                                <div className='flex h-5 items-center justify-end ml-auto mt-1'>
                                  {icon}
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>

                          {hasFormOrDescription ? (
                            <AccordionContent
                              className={cn(
                                'px-4 pt-2 pb-4',
                                isSingleMethod ? 'pl-4' : 'pl-10'
                              )}
                            >
                              {methodForm || methodDescription}
                            </AccordionContent>
                          ) : null}
                        </AccordionItem>
                      );
                    }
                  )}
                </Accordion>
              </FormControl>
            </FormItem>
          )}
        />
      ) : null}

      {isShipping &&
      session?.enableShipping &&
      paymentMethod !== PaymentMethodType.CREDIT_CARD ? (
        <PaymentAddressToggle />
      ) : null}
      {isBillingAddressRequired ? (
        <CheckoutSection className={isPickup ? 'pt-5' : ''}>
          <CheckoutSectionHeader
            title={t.payment.billingAddress.title}
            description={t.payment.billingAddress.description}
          />
          <AddressForm sectionKey='billing' />
        </CheckoutSection>
      ) : null}

      <div className='md:hidden'>
        <Accordion type='single' collapsible>
          <AccordionItem value='order-summary' className='border-none'>
            <AccordionTrigger
              className='py-4 px-0 border-b border-border hover:no-underline'
              tabIndex={0}
            >
              <div className='flex justify-between items-center w-full'>
                <span className='font-medium self-center'>
                  {t.totals.orderSummary}
                </span>
                <span className='font-bold text-lg pr-2 self-center'>
                  {formatCurrency({
                    amount: props.total || 0,
                    currencyCode: props.currencyCode || 'USD',
                    inputInMinorUnits: true,
                  })}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className='pt-4'>
              <div>
                <DraftOrderLineItems
                  currencyCode={props.currencyCode}
                  items={props.items}
                  inputInMinorUnits
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className='pt-4'>
          <DraftOrderTotals
            inputInMinorUnits
            currencyCode={props.currencyCode}
            tip={props.tip}
            taxes={props.taxes}
            isTaxLoading={props.isTaxLoading}
            isShippingLoading={props.isShippingLoading}
            subtotal={props.subtotal}
            discount={props.discount}
            shipping={props.shipping}
            totalSavings={props.totalSavings}
            itemCount={props.itemCount}
            total={props.total}
            enableShipping={props.enableShipping}
            enableDiscounts={session?.enablePromotionCodes}
            enableTaxes={session?.enableTaxCollection}
          />
        </div>
      </div>

      <div>
        <div className='flex flex-col gap-2'>
          <Target id='checkout.form.submit.before' />
          {/* The payment form is handled inside the payment method component; the checkout button is rendered below */}
          {getCheckoutButton()}
          <Target id='checkout.form.submit.after' />
        </div>
      </div>
    </div>
  );
}
