import { zodResolver } from '@hookform/resolvers/zod';
import { useIsMutating } from '@tanstack/react-query';
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AddressForm } from '@/components/checkout/address';
import {
  type CheckoutFormData,
  type CheckoutProps,
  LayoutSections,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { CheckoutSection } from '@/components/checkout/checkout-section';
import { CheckoutSectionHeader } from '@/components/checkout/checkout-section-header';
import { ContactForm } from '@/components/checkout/contact/contact-form';
import {
  DeliveryMethodForm,
  DeliveryMethods,
} from '@/components/checkout/delivery/delivery-method';
import { ExpressCheckoutButtons } from '@/components/checkout/express-checkout/express-checkout-buttons';
import { CheckoutErrorList } from '@/components/checkout/form/checkout-error-list';
import {
  DraftOrderLineItems,
  type Product,
} from '@/components/checkout/line-items/line-items';
import { NotesForm } from '@/components/checkout/notes/notes-form';
import {
  useDraftOrder,
  useDraftOrderTotals,
} from '@/components/checkout/order/use-draft-order';
import { PaymentForm } from '@/components/checkout/payment/payment-form';
import {
  ConditionalExpressProviders,
  ConditionalPaymentProviders,
} from '@/components/checkout/payment/utils/conditional-providers';
import { LocalPickupForm } from '@/components/checkout/pickup/local-pickup';
import { ShippingMethodForm } from '@/components/checkout/shipping/shipping-method';
import { Target } from '@/components/checkout/target/target';
import { TipsForm } from '@/components/checkout/tips/tips-form';
import { DraftOrderTotals } from '@/components/checkout/totals/totals';
import { formatCurrency } from '@/components/checkout/utils/format-currency';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useGoDaddyContext } from '@/godaddy-provider';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import { CheckoutType, PaymentMethodType } from '@/types';
import { FreePaymentForm } from '../payment/free-payment-form';
import { CustomFormProvider } from './custom-form-provider';

const deliveryMethodToGridArea: Record<string, string> = {
  SHIP: 'shipping',
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  DIGITAL: 'digital',
};

interface CheckoutFormProps extends Omit<CheckoutProps, 'session'> {
  schema: z.ZodObject<any> | z.ZodEffects<any>;
  defaultValues?: Pick<CheckoutFormData, 'contactEmail'>;
  items: Product[];
}

export function CheckoutForm({
  schema,
  defaultValues,
  items,
  ...props
}: CheckoutFormProps) {
  const { t } = useGoDaddyContext();
  const { session, isCheckoutDisabled } = useCheckoutContext();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
    reValidateMode: 'onBlur',
    mode: 'onBlur',
  });

  const deliveryMethod = form.watch('deliveryMethod');
  const tipAmount = form.watch('tipAmount');
  const isPickup = deliveryMethod === DeliveryMethods.PICKUP;
  const isShipping = deliveryMethod === DeliveryMethods.SHIP;
  const isUpdatingShipping =
    useIsMutating({
      mutationKey: ['apply-shipping-method', { sessionId: session?.id }],
    }) > 0;

  const isDiscountApplying =
    useIsMutating({
      mutationKey: ['apply-discount', { sessionId: session?.id }],
    }) > 0;

  const isUpdatingTaxes =
    useIsMutating({
      mutationKey: ['update-draft-order-taxes', { id: session?.id }],
    }) > 0;

  const draftOrderTotalsQuery = useDraftOrderTotals();
  const draftOrder = useDraftOrder();

  const { data: totals, isLoading: totalsLoading } = draftOrderTotalsQuery;
  const { data: order } = draftOrder;

  // Order summary calculations - keep all values in minor units
  const subtotal = totals?.subTotal?.value || 0;
  const orderDiscount = totals?.discountTotal?.value || 0;
  const shipping =
    order?.shippingLines?.reduce(
      (sum, line) => sum + (line?.amount?.value || 0),
      0
    ) || 0;
  const taxTotal = totals?.taxTotal?.value || 0;
  const orderTotal = totals?.total?.value || 0;
  const tipTotal = tipAmount || 0;
  const currencyCode = totals?.total?.currencyCode || 'USD';
  const itemCount = items.reduce((sum, item) => sum + (item?.quantity || 0), 0);

  const isFree = orderTotal <= 0;
  const showExpressButtons = subtotal > 0;

  useEffect(() => {
    if (!totalsLoading && isFree) {
      form.setValue('paymentMethod', PaymentMethodType.OFFLINE);
    }
  }, [form, totalsLoading, isFree]);

  // Track checkout start impression when the component first renders
  const hasTrackedCheckoutStart = useRef(false);
  useEffect(() => {
    if (!hasTrackedCheckoutStart.current && !totalsLoading) {
      track({
        eventId: eventIds.checkoutStart,
        type: TrackingEventType.IMPRESSION,
        properties: {
          subtotal: subtotal,
          total: orderTotal,
          itemCount,
          currencyCode,
        },
      });
      hasTrackedCheckoutStart.current = true;
    }
  }, [subtotal, orderTotal, itemCount, currencyCode, totalsLoading]);

  const lineItemDiscounts = items.reduce((sum, item) => {
    if (item?.discounts && Array.isArray(item.discounts)) {
      return (
        sum +
        item.discounts.reduce(
          (dSum, discount) => dSum + (discount.amount?.value || 0),
          0
        )
      );
    }
    return sum;
  }, 0);

  const totalSavings = Math.abs(orderDiscount + lineItemDiscounts);

  const [gridTemplateAreas, sectionLength] = React.useMemo(() => {
    const { enableTips, paymentMethods, enableShipping, enableLocalPickup } =
      session || {};
    if (!props?.layout) {
      const enableExpressCheckout = Object.values(paymentMethods ?? {}).some(
        method =>
          method &&
          Array.isArray(method.checkoutTypes) &&
          method.checkoutTypes.includes(CheckoutType.EXPRESS)
      );

      const enableDelivery = enableShipping || enableLocalPickup;
      const defaultTemplate = ` ${enableExpressCheckout ? "'express-checkout'" : ''} 'contact' ${enableDelivery ? "'delivery'" : ''} '${deliveryMethodToGridArea[deliveryMethod]}' ${enableTips ? "'tips'" : ''} 'payment'`;
      // Return consistent tuple type: [string, number]
      let totalSections = 2;
      enableTips && totalSections++;
      enableDelivery && totalSections++;
      enableExpressCheckout && totalSections++;
      return [defaultTemplate, totalSections];
    }

    // Filter out sections that shouldn't be shown based on delivery method
    const filteredLayout = props.layout.filter(section => {
      if (section !== 'shipping' && section !== 'pickup') {
        return true;
      }

      // Only include shipping section if deliveryMethod is SHIP
      if (section === 'shipping' && deliveryMethod === DeliveryMethods.SHIP) {
        return true;
      }

      // Only include pickup section if deliveryMethod is PICKUP
      return section === 'pickup' && deliveryMethod === DeliveryMethods.PICKUP;
    });

    // Get all available section values
    const sectionValues = Object.values(LayoutSections);

    const missingLayoutSections = sectionValues.filter(section => {
      if (section === 'shipping' && deliveryMethod !== DeliveryMethods.SHIP) {
        return false;
      }
      if (section === 'pickup' && deliveryMethod !== DeliveryMethods.PICKUP) {
        return false;
      }

      if (!enableTips && section === 'tips') {
        return false;
      }
      return !filteredLayout.includes(section);
    });

    // Add missing sections to the end of the layout
    const completeLayout = [...filteredLayout, ...missingLayoutSections];

    return [`'${completeLayout.join("' '")}'`, completeLayout.length];
  }, [props?.layout, deliveryMethod, session]);

  React.useEffect(() => {
    if (deliveryMethod) {
      form.reset(form.getValues(), {
        keepDirty: false,
      });
    }
    /* reset pickup fields if switching to shipping */
    if (isShipping) {
      form.setValue('pickupLocationId', null);
      form.setValue('pickupDate', '');
      form.setValue('pickupTime', '');
    }
  }, [deliveryMethod, isShipping, form]);

  const onSubmit = async (data: CheckoutFormData) => {
    // Track checkout form submission
    track({
      eventId: eventIds.submitCheckoutForm,
      type: TrackingEventType.CLICK,
      properties: {
        success: true,
        deliveryMethod: data.deliveryMethod,
        hasShippingAddress: !!data.shippingAddressLine1,
        hasBillingAddress: !!data.billingAddressLine1,
        total: orderTotal,
      },
    });
  };

  const onInvalid = (errors: typeof form.formState.errors) => {
    // console.log({ formValues: form.getValues() });
    // console.log("Invalid fields:", errors);

    // Track form validation errors
    track({
      eventId: eventIds.formValidationError,
      type: TrackingEventType.EVENT,
      properties: {
        errorFields: Object.keys(errors).join(','),
        errorCount: Object.keys(errors).length,
      },
    });
  };

  return (
    <CustomFormProvider {...form}>
      <div>
        <Target id='checkout.before' />
        <div
          className={`grid min-h-screen grid-cols-1 ${
            props.direction === 'rtl'
              ? "md:grid-cols-[1fr_minmax(min-content,_calc(50%_+_calc(calc(66rem_-_52rem)_/_2)))] [grid-template-areas:'left'_'right'] md:[grid-template-areas:'right_left']"
              : "md:grid-cols-[minmax(min-content,_calc(50%_+_calc(calc(66rem_-_52rem)_/_2)))_1fr] [grid-template-areas:'right'_'left'] md:[grid-template-areas:'left_right']"
          }`}
        >
          {/* Left column - Forms */}
          <div
            style={{
              gridArea: 'left',
            }}
            className={`flex ${props.direction === 'rtl' ? 'md:justify-start' : 'md:justify-end'} h-full bg-background border-r border-border sm:border-r-0 md:border-r`}
          >
            <div className='p-8 w-full md:max-w-[618px]'>
              <Target id='checkout.form.before' />
              <CheckoutErrorList />
              <form
                onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                className='grid gap-4'
              >
                <div
                  className='grid gap-4'
                  style={{
                    gridTemplateColumns: '1fr',
                    gridTemplateRows: `repeat(${sectionLength}, auto)`,
                    gridTemplateAreas,
                  }}
                >
                  {!isCheckoutDisabled && showExpressButtons ? (
                    <ConditionalExpressProviders>
                      <ExpressCheckoutButtons />
                    </ConditionalExpressProviders>
                  ) : null}

                  <CheckoutSection style={{ gridArea: 'contact' }}>
                    <Target id='checkout.form.contact.before' />
                    <CheckoutSectionHeader
                      title={t.contact.title}
                      description={t.contact.description}
                    />
                    <ContactForm />
                    <Target id='checkout.form.contact.after' />
                  </CheckoutSection>
                  {session?.enableShipping || session?.enableLocalPickup ? (
                    <CheckoutSection style={{ gridArea: 'delivery' }}>
                      <Target id='checkout.form.delivery.before' />
                      <CheckoutSectionHeader title={t.delivery?.title} />
                      <DeliveryMethodForm />
                      <Target id='checkout.form.delivery.after' />
                    </CheckoutSection>
                  ) : null}
                  {session?.enableTips ? (
                    <CheckoutSection style={{ gridArea: 'tips' }}>
                      <Target id='checkout.form.tips.before' />
                      <CheckoutSectionHeader title={t.tips?.title} />
                      <TipsForm
                        currencyCode={currencyCode}
                        total={orderTotal}
                      />
                      <Target id='checkout.form.tips.after' />
                    </CheckoutSection>
                  ) : null}
                  {isPickup && session?.enableLocalPickup ? (
                    <CheckoutSection style={{ gridArea: 'pickup' }}>
                      <Target id='checkout.form.pickup.before' />
                      <CheckoutSectionHeader
                        title={t.pickup.title}
                        description={t.pickup.description}
                        classNames={{
                          description: 'text-xs',
                        }}
                      />
                      <Target id='checkout.form.pickup.form.before' />
                      <LocalPickupForm showStoreHours={props?.showStoreHours} />
                      <Target id='checkout.form.pickup.after' />
                    </CheckoutSection>
                  ) : null}
                  {isShipping && session?.enableShipping ? (
                    <CheckoutSection style={{ gridArea: 'shipping' }}>
                      <Target id='checkout.form.shipping.before' />
                      <CheckoutSectionHeader
                        title={t.shipping.title}
                        description={
                          session?.enableShippingAddressCollection
                            ? t.shipping.description
                            : undefined
                        }
                      />
                      <div className='space-y-4'>
                        {session?.enableShippingAddressCollection ? (
                          <AddressForm sectionKey='shipping' />
                        ) : null}
                        {session?.shipping?.originAddress ? (
                          <ShippingMethodForm />
                        ) : (
                          <div className='bg-muted rounded-md p-6 flex justify-center items-center'>
                            <p className='text-sm text-center w-full'>
                              {t?.shipping?.noShippingOriginAddress}
                            </p>
                          </div>
                        )}
                        {session?.enableNotesCollection ? <NotesForm /> : null}
                      </div>
                      <Target id='checkout.form.shipping.after' />
                    </CheckoutSection>
                  ) : null}
                  <CheckoutSection style={{ gridArea: 'payment' }}>
                    <Target id='checkout.form.payment.before' />
                    <CheckoutSectionHeader
                      title={t.payment.title}
                      description={t.payment.description}
                    />
                    <div className='space-y-2'>
                      {!isCheckoutDisabled ? (
                        !isFree ? (
                          <ConditionalPaymentProviders>
                            <PaymentForm
                              items={items}
                              currencyCode={currencyCode}
                              tip={tipTotal}
                              taxes={taxTotal}
                              isTaxLoading={isUpdatingTaxes}
                              isShippingLoading={isUpdatingShipping}
                              isDiscountLoading={isDiscountApplying}
                              subtotal={subtotal}
                              discount={orderDiscount}
                              shipping={shipping}
                              totalSavings={totalSavings}
                              itemCount={itemCount}
                              total={orderTotal}
                              enableShipping={
                                isShipping && session?.enableShipping
                              }
                            />
                          </ConditionalPaymentProviders>
                        ) : (
                          <FreePaymentForm />
                        )
                      ) : null}
                    </div>
                    <Target id='checkout.form.payment.after' />
                  </CheckoutSection>
                </div>
              </form>
              <Target id='checkout.form.after' />
            </div>
          </div>

          {/* Right column - Order summary */}
          <div
            className='bg-secondary-background'
            style={{ gridArea: 'right' }}
          >
            <div
              className={`p-0 md:p-8 w-full md:max-w-xl md:sticky md:top-0 ${props.direction === 'rtl' ? 'md:ml-auto' : ''}`}
            >
              <Target id='checkout.summary.before' />
              <div className='md:hidden'>
                <Accordion type='single' collapsible>
                  <AccordionItem value='order-summary' className='border-none'>
                    <AccordionTrigger className='py-4 px-8 border-b border-border hover:no-underline'>
                      <div className='flex justify-between items-center w-full'>
                        <span className='font-medium self-center'>
                          {t.totals.orderSummary}
                        </span>
                        <span className='font-bold text-lg pr-2 self-center'>
                          {formatCurrency({
                            amount: totals?.total?.value || 0,
                            currencyCode,
                            isInCents: true,
                          })}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='p-8'>
                      <div className='pb-4'>
                        <DraftOrderLineItems
                          currencyCode={currencyCode}
                          items={items}
                          isInCents
                        />

                        <DraftOrderTotals
                          isInCents
                          currencyCode={currencyCode}
                          tip={tipTotal}
                          taxes={taxTotal}
                          isTaxLoading={isUpdatingTaxes}
                          isShippingLoading={isUpdatingShipping}
                          subtotal={subtotal}
                          discount={orderDiscount}
                          isDiscountLoading={isDiscountApplying}
                          shipping={shipping}
                          totalSavings={totalSavings}
                          itemCount={itemCount}
                          total={orderTotal}
                          enableDiscounts={session?.enablePromotionCodes}
                          enableTaxes={session?.enableTaxCollection}
                          enableShipping={isShipping && session?.enableShipping}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className='hidden md:block'>
                <DraftOrderLineItems
                  currencyCode={currencyCode}
                  items={items}
                  isInCents
                />

                <DraftOrderTotals
                  isInCents
                  currencyCode={currencyCode}
                  tip={tipTotal}
                  taxes={taxTotal}
                  isTaxLoading={isUpdatingTaxes}
                  isShippingLoading={isUpdatingShipping}
                  subtotal={subtotal}
                  discount={orderDiscount}
                  isDiscountLoading={isDiscountApplying}
                  shipping={shipping}
                  totalSavings={totalSavings}
                  itemCount={itemCount}
                  total={orderTotal}
                  enableDiscounts={session?.enablePromotionCodes}
                  enableTaxes={session?.enableTaxCollection}
                  enableShipping={isShipping && session?.enableShipping}
                />
              </div>
              <Target id='checkout.summary.after' />
            </div>
          </div>
        </div>
        <Target id='checkout.after' />
      </div>
    </CustomFormProvider>
  );
}
