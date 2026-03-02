import { ExpressCheckoutElement, useElements } from '@stripe/react-stripe-js';
import type {
  LineItem,
  ShippingRate,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from '@stripe/stripe-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useGetPriceAdjustments } from '@/components/checkout/discount/utils/use-get-price-adjustments';
import {
  useDraftOrder,
  useDraftOrderTotals,
} from '@/components/checkout/order/use-draft-order';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useStripeCheckout } from '@/components/checkout/payment/utils/use-stripe-checkout';
import { useStripePaymentIntent } from '@/components/checkout/payment/utils/use-stripe-payment-intent';
import { filterAndSortShippingMethods } from '@/components/checkout/shipping/utils/filter-shipping-methods';
import { useGetShippingMethodByAddress } from '@/components/checkout/shipping/utils/use-get-shipping-methods';
import { useGetTaxes } from '@/components/checkout/taxes/utils/use-get-taxes';

import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import type {
  CalculatedAdjustments,
  CalculatedTaxes,
  ShippingMethod,
} from '@/types';

// Type for partial address from Stripe shipping address change event
interface StripePartialAddress {
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export function StripeExpressCheckoutForm() {
  const { t } = useGoDaddyContext();
  const { session, setCheckoutErrors, isConfirmingCheckout } =
    useCheckoutContext();
  const elements = useElements();
  const isPaymentDisabled = useIsPaymentDisabled();
  const { handleSubmit } = useStripeCheckout({
    mode: 'express',
  });

  // Combined disabled state
  const isDisabled = isConfirmingCheckout || isPaymentDisabled;

  // Data hooks
  const { data: totals } = useDraftOrderTotals();
  const { data: draftOrder } = useDraftOrder();
  const getShippingMethodsByAddress = useGetShippingMethodByAddress();
  const getTaxes = useGetTaxes();
  const getPriceAdjustments = useGetPriceAdjustments();

  // Currency configuration
  const currencyCode = totals?.total?.currencyCode || 'USD';

  // State for tracking calculated values during express checkout flow
  const [calculatedTaxes, setCalculatedTaxes] =
    useState<CalculatedTaxes | null>(null);
  const [shippingMethods, setShippingMethods] = useState<
    ShippingMethod[] | null
  >(null);
  const [selectedShippingRate, setSelectedShippingRate] =
    useState<ShippingRate | null>(null);
  const [shippingAddress, setShippingAddress] =
    useState<StripePartialAddress | null>(null);

  // Track the status of coupon code fetching
  const [couponFetchStatus, setCouponFetchStatus] = useState<
    'idle' | 'fetching' | 'done'
  >('idle');

  // Use refs for values needed in event handlers to avoid stale closures
  const appliedCouponCodeRef = useRef<string | null>(null);
  const calculatedAdjustmentsRef = useRef<CalculatedAdjustments | null>(null);

  // Extract discount codes from draft order for comparison (stable string)
  const draftOrderDiscountCodes = useMemo(() => {
    const allCodes = new Set<string>();

    // Add order-level discount codes
    if (draftOrder?.discounts) {
      for (const discount of draftOrder.discounts) {
        if (discount.code) {
          allCodes.add(discount.code);
        }
      }
    }

    // Add line item-level discount codes
    if (draftOrder?.lineItems) {
      for (const lineItem of draftOrder.lineItems) {
        if (lineItem.discounts) {
          for (const discount of lineItem.discounts) {
            if (discount.code) {
              allCodes.add(discount.code);
            }
          }
        }
      }
    }

    return Array.from(allCodes).sort().join(','); // Stable string for comparison
  }, [draftOrder]);

  // Fetch and cache price adjustments for pre-applied coupons
  useEffect(() => {
    if (!draftOrder) return;
    // Prevent concurrent fetches (but allow new fetches when draft order changes)
    if (couponFetchStatus === 'fetching') return;

    const fetchPriceAdjustments = async () => {
      setCouponFetchStatus('fetching');

      try {
        const allCodes = new Set<string>();

        // Add order-level discount codes
        if (draftOrder?.discounts) {
          for (const discount of draftOrder.discounts) {
            if (discount.code) {
              allCodes.add(discount.code);
            }
          }
        }

        // Add line item-level discount codes
        if (draftOrder?.lineItems) {
          for (const lineItem of draftOrder.lineItems) {
            if (lineItem.discounts) {
              for (const discount of lineItem.discounts) {
                if (discount.code) {
                  allCodes.add(discount.code);
                }
              }
            }
          }
        }

        const discountCodes = Array.from(allCodes);

        // Update refs based on what's in the draft order
        if (discountCodes?.length && discountCodes?.[0]) {
          const result = await getPriceAdjustments.mutateAsync({
            discountCodes: [discountCodes[0]],
          });

          if (result) {
            // Update refs with current coupon state
            appliedCouponCodeRef.current = discountCodes[0];
            calculatedAdjustmentsRef.current = result;
          }
        } else {
          // No coupons in draft order - clear refs
          appliedCouponCodeRef.current = null;
          calculatedAdjustmentsRef.current = null;
        }
      } finally {
        setCouponFetchStatus('done');
      }
    };

    fetchPriceAdjustments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftOrder, draftOrderDiscountCodes]);

  // Calculate taxes for express checkout
  const calculateExpressTaxes = useCallback(
    async ({
      address,
      shippingAmount,
      discountAdjustments,
    }: {
      address: StripePartialAddress | null;
      shippingAmount: number;
      discountAdjustments?: CalculatedAdjustments | null;
    }) => {
      if (!address || !session?.enableTaxCollection) return null;

      const taxesRequest = {
        destination: {
          countryCode: address.country || 'US',
          postalCode: address.postal_code || '',
          adminArea2: address.city || '',
          adminArea1: address.state || '',
        },
        lines: [
          {
            type: 'SHIPPING' as const,
            subtotalPrice: {
              currencyCode: currencyCode,
              value: shippingAmount,
            },
          },
        ],
        discountAdjustments: discountAdjustments || undefined,
      };

      return await getTaxes.mutateAsync(taxesRequest);
    },
    [getTaxes, session?.enableTaxCollection, currencyCode]
  );

  // Get sorted shipping methods for an address
  const getSortedShippingMethods = useCallback(
    async (address: StripePartialAddress) => {
      const shippingMethodsData = await getShippingMethodsByAddress.mutateAsync(
        {
          countryCode: address.country || 'US',
          postalCode: address.postal_code || '',
          adminArea2: address.city || '',
          adminArea1: address.state || '',
        }
      );

      setShippingMethods(shippingMethodsData || null);

      const orderSubTotal = totals?.subTotal?.value || 0;

      return filterAndSortShippingMethods({
        shippingMethods: shippingMethodsData || [],
        orderSubTotal,
        experimentalRules: session?.experimental_rules,
      });
    },
    [
      getShippingMethodsByAddress,
      session?.experimental_rules,
      totals?.subTotal?.value,
    ]
  );

  // Convert shipping methods to Stripe ShippingRate format
  const convertToStripeShippingRates = useCallback(
    (methods: ShippingMethod[]): ShippingRate[] => {
      return methods.map(method => ({
        id:
          method.displayName?.replace(/\s+/g, '-')?.toLowerCase() || 'shipping',
        amount: method.cost?.value || 0,
        displayName: method.displayName || t.totals.shipping,
        deliveryEstimate: method.description || undefined,
      }));
    },
    [t.totals.shipping]
  );

  // Build line items for Stripe payment sheet
  const buildLineItems = useCallback(
    ({
      shippingAmount = 0,
      taxAmount = 0,
      discountAmount = 0,
    }: {
      shippingAmount?: number;
      taxAmount?: number;
      discountAmount?: number;
    }): LineItem[] => {
      const items: LineItem[] = [];
      const subtotal = totals?.subTotal?.value || 0;

      // Add subtotal
      items.push({
        name: t.totals.subtotal,
        amount: subtotal,
      });

      // Add shipping if present
      if (shippingAmount > 0) {
        items.push({
          name: t.totals.shipping,
          amount: shippingAmount,
        });
      }

      // Add taxes if present
      if (taxAmount > 0) {
        items.push({
          name: t.totals.estimatedTaxes,
          amount: taxAmount,
        });
      }

      // Add discount if present (as negative)
      if (discountAmount > 0) {
        items.push({
          name: t.totals.discount,
          amount: -discountAmount,
        });
      }

      return items;
    },
    [totals?.subTotal?.value, t.totals]
  );

  // Recalculate adjustments when shipping changes
  const recalculateAdjustments = useCallback(
    async ({
      address,
      shippingAmount,
      shippingMethodName,
    }: {
      address: StripePartialAddress;
      shippingAmount: number;
      shippingMethodName: string;
    }) => {
      const currentCouponCode = appliedCouponCodeRef.current;
      if (!currentCouponCode) return null;

      try {
        const shippingLines = [
          {
            subTotal: {
              currencyCode: currencyCode,
              value: shippingAmount,
            },
            name: shippingMethodName,
          },
        ];

        const newAdjustments = await getPriceAdjustments.mutateAsync({
          discountCodes: [currentCouponCode],
          shippingLines,
        });

        if (newAdjustments?.totalDiscountAmount) {
          calculatedAdjustmentsRef.current = newAdjustments;
          return newAdjustments;
        }

        // Coupon no longer valid
        calculatedAdjustmentsRef.current = null;
        appliedCouponCodeRef.current = null;
        return null;
      } catch {
        // Error calculating adjustments
        calculatedAdjustmentsRef.current = null;
        appliedCouponCodeRef.current = null;
        return null;
      }
    },
    [currencyCode, getPriceAdjustments]
  );

  // Handle ready event - track impression
  const handleReady = useCallback(
    (event: StripeExpressCheckoutElementReadyEvent) => {
      if (event.availablePaymentMethods?.applePay) {
        track({
          eventId: eventIds.expressApplePayImpression,
          type: TrackingEventType.IMPRESSION,
          properties: {
            provider: 'stripe',
          },
        });
      }
    },
    []
  );

  // Handle click event - configure initial details
  const handleClick = useCallback(
    (event: StripeExpressCheckoutElementClickEvent) => {
      // Reject if payment is disabled
      if (isDisabled) {
        event.reject();
        return;
      }

      // Track click
      if (event.expressPaymentType === 'apple_pay') {
        track({
          eventId: eventIds.expressApplePayClick,
          type: TrackingEventType.CLICK,
          properties: {
            paymentType: 'apple_pay',
            provider: 'stripe',
          },
        });
      }

      // Reset state for fresh calculation
      setCalculatedTaxes(null);
      setShippingMethods(null);
      setSelectedShippingRate(null);
      setShippingAddress(null);
      setCheckoutErrors(undefined);

      // Get pre-applied discount amount
      const discountAmount =
        calculatedAdjustmentsRef.current?.totalDiscountAmount?.value || 0;

      // Configure initial line items
      event.resolve({
        lineItems: buildLineItems({ discountAmount }),
      });
    },
    [buildLineItems, setCheckoutErrors, isDisabled]
  );

  // Handle shipping address change
  const handleShippingAddressChange = useCallback(
    async (event: StripeExpressCheckoutElementShippingAddressChangeEvent) => {
      const address = event.address;
      setShippingAddress(address);

      try {
        // Get shipping methods for this address
        const methods = await getSortedShippingMethods(address);

        if (!methods || methods.length === 0) {
          event.reject();
          return;
        }

        const stripeShippingRates = convertToStripeShippingRates(methods);
        const defaultRate = stripeShippingRates[0];
        setSelectedShippingRate(defaultRate);

        // Recalculate adjustments with new shipping
        const adjustments = await recalculateAdjustments({
          address,
          shippingAmount: defaultRate.amount,
          shippingMethodName: defaultRate.displayName,
        });

        // Calculate taxes
        let taxAmount = 0;
        if (session?.enableTaxCollection) {
          try {
            const taxesResult = await calculateExpressTaxes({
              address,
              shippingAmount: defaultRate.amount,
              discountAdjustments: adjustments,
            });

            if (taxesResult?.totalTaxAmount?.value) {
              taxAmount = taxesResult.totalTaxAmount.value;
              setCalculatedTaxes(taxesResult);
            }
          } catch {
            // Tax calculation failed - continue without taxes
            setCheckoutErrors([
              t.apiErrors?.TAX_CALCULATION_ERROR || 'Tax calculation error',
            ]);
          }
        }

        const discountAmount = adjustments?.totalDiscountAmount?.value || 0;
        const subtotal = totals?.subTotal?.value || 0;

        // Calculate new total and update Elements amount before resolving
        // This ensures Stripe's lineItems validation passes
        const newTotal =
          subtotal + defaultRate.amount + taxAmount - discountAmount;
        elements?.update({ amount: newTotal });

        event.resolve({
          shippingRates: stripeShippingRates,
          lineItems: buildLineItems({
            shippingAmount: defaultRate.amount,
            taxAmount,
            discountAmount,
          }),
        });
      } catch {
        event.reject();
      }
    },
    [
      getSortedShippingMethods,
      convertToStripeShippingRates,
      recalculateAdjustments,
      calculateExpressTaxes,
      buildLineItems,
      session?.enableTaxCollection,
      setCheckoutErrors,
      elements,
      totals?.subTotal?.value,
      t.apiErrors,
    ]
  );

  // Handle shipping rate change
  const handleShippingRateChange = useCallback(
    async (event: StripeExpressCheckoutElementShippingRateChangeEvent) => {
      const selectedRate = event.shippingRate;
      setSelectedShippingRate(selectedRate);

      if (!shippingAddress) {
        event.reject();
        return;
      }

      try {
        // Recalculate adjustments with new shipping rate
        const adjustments = await recalculateAdjustments({
          address: shippingAddress,
          shippingAmount: selectedRate.amount,
          shippingMethodName: selectedRate.displayName,
        });

        // Recalculate taxes
        let taxAmount = 0;
        if (session?.enableTaxCollection) {
          try {
            const taxesResult = await calculateExpressTaxes({
              address: shippingAddress,
              shippingAmount: selectedRate.amount,
              discountAdjustments: adjustments,
            });

            if (taxesResult?.totalTaxAmount?.value) {
              taxAmount = taxesResult.totalTaxAmount.value;
              setCalculatedTaxes(taxesResult);
            }
          } catch {
            // Tax calculation failed - continue with previous taxes
            taxAmount = calculatedTaxes?.totalTaxAmount?.value || 0;
          }
        }

        const discountAmount = adjustments?.totalDiscountAmount?.value || 0;
        const subtotal = totals?.subTotal?.value || 0;

        // Calculate new total and update Elements amount before resolving
        // This ensures Stripe's lineItems validation passes
        const newTotal =
          subtotal + selectedRate.amount + taxAmount - discountAmount;
        elements?.update({ amount: newTotal });

        event.resolve({
          lineItems: buildLineItems({
            shippingAmount: selectedRate.amount,
            taxAmount,
            discountAmount,
          }),
        });
      } catch {
        event.reject();
      }
    },
    [
      shippingAddress,
      recalculateAdjustments,
      calculateExpressTaxes,
      buildLineItems,
      session?.enableTaxCollection,
      calculatedTaxes,
      elements,
      totals?.subTotal?.value,
    ]
  );

  // Handle confirm event
  const handleConfirm = useCallback(
    async (event: StripeExpressCheckoutElementConfirmEvent) => {
      try {
        // Find the selected shipping method from our stored shipping methods
        const selectedShippingMethod = shippingMethods?.find(
          method =>
            method.displayName?.replace(/\s+/g, '-')?.toLowerCase() ===
            selectedShippingRate?.id
        );

        // Pass all the calculated data to handleSubmit
        await handleSubmit({
          event,
          calculatedTaxes,
          calculatedAdjustments: calculatedAdjustmentsRef.current,
          shippingTotal: selectedShippingRate
            ? {
                currencyCode,
                value: selectedShippingRate.amount,
              }
            : null,
          selectedShippingMethod: selectedShippingMethod || null,
        });

        // Track successful payment
        track({
          eventId: eventIds.expressApplePayCompleted,
          type: TrackingEventType.EVENT,
          properties: {
            paymentType: event.expressPaymentType,
            provider: 'stripe',
          },
        });
      } catch (error) {
        // Track error
        track({
          eventId: eventIds.expressCheckoutError,
          type: TrackingEventType.EVENT,
          properties: {
            paymentType: event.expressPaymentType,
            provider: 'stripe',
            errorType: error instanceof Error ? error.message : 'unknown',
          },
        });

        event.paymentFailed({
          reason: 'fail',
          message: t.errors.errorProcessingPayment,
        });
      }
    },
    [
      handleSubmit,
      t.errors.errorProcessingPayment,
      shippingMethods,
      selectedShippingRate,
      calculatedTaxes,
      currencyCode,
    ]
  );

  // Handle cancel event
  const handleCancel = useCallback(() => {
    // Reset state when payment sheet is dismissed
    setCalculatedTaxes(null);
    setShippingMethods(null);
    setSelectedShippingRate(null);
    setShippingAddress(null);
  }, []);

  return (
    <div className={isDisabled ? 'opacity-50 pointer-events-none' : undefined}>
      <ExpressCheckoutElement
        options={{
          paymentMethods: {
            applePay: 'auto',
            googlePay: 'auto',
            link: 'never',
            paypal: 'never',
            amazonPay: 'never',
            klarna: 'never',
          },
          // Button styling
          buttonHeight: 50,
          buttonType: {
            applePay: 'plain',
            googlePay: 'plain',
          },
          buttonTheme: {
            applePay: 'black',
            googlePay: 'black',
          },
          // Layout
          layout: {
            maxColumns: 2,
            maxRows: 1,
          },
          // Shipping configuration
          shippingAddressRequired: !!session?.enableShippingAddressCollection,
          // Billing and contact info
          billingAddressRequired: !!session?.enableBillingAddressCollection,
          emailRequired: true,
          phoneNumberRequired: false,
          // Business info
          business: session?.storeName
            ? { name: session.storeName }
            : undefined,
        }}
        onReady={handleReady}
        onClick={handleClick}
        onShippingAddressChange={handleShippingAddressChange}
        onShippingRateChange={handleShippingRateChange}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

export function StripeExpressCheckoutButton() {
  const { t } = useGoDaddyContext();
  const { stripeConfig } = useCheckoutContext();

  if (!stripeConfig) {
    return (
      <div className='text-destructive'>{t.errors.stripeConfigMissing}</div>
    );
  }

  const { isLoading } = useStripePaymentIntent();

  return (
    <>
      {isLoading ? (
        <div className='grid gap-1 grid-cols-1'>
          <Skeleton className='h-12 w-full mb-1' />
        </div>
      ) : null}
      <StripeExpressCheckoutForm />
    </>
  );
}
