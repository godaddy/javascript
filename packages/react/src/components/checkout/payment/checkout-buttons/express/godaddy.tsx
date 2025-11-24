import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useGetPriceAdjustments } from '@/components/checkout/discount/utils/use-get-price-adjustments';
import {
  useDraftOrder,
  useDraftOrderTotals,
} from '@/components/checkout/order/use-draft-order';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import type {
  Address,
  ShippingMethod,
  ShippingMethods,
  TokenizeJs,
  WalletError,
  WalletRequestUpdate,
} from '@/components/checkout/payment/types';
import {
  type PoyntExpressRequest,
  useBuildPaymentRequest,
} from '@/components/checkout/payment/utils/use-build-payment-request';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useLoadPoyntCollect } from '@/components/checkout/payment/utils/use-load-poynt-collect';
import { filterAndSortShippingMethods } from '@/components/checkout/shipping/utils/filter-shipping-methods';
import { useGetShippingMethodByAddress } from '@/components/checkout/shipping/utils/use-get-shipping-methods';
import { useGetTaxes } from '@/components/checkout/taxes/utils/use-get-taxes';
import { mapOrderToFormValues } from '@/components/checkout/utils/checkout-transformers';
import { useFormatCurrency } from '@/components/checkout/utils/format-currency';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { eventIds } from '@/tracking/events';
import {
  type TrackingEventId,
  TrackingEventType,
  track,
} from '@/tracking/track';

export function ExpressCheckoutButton() {
  const formatCurrency = useFormatCurrency();
  const { session, setCheckoutErrors } = useCheckoutContext();
  const { isPoyntLoaded } = useLoadPoyntCollect();
  const { godaddyPaymentsConfig } = useCheckoutContext();
  const { t } = useGoDaddyContext();
  const [isCollectLoading, setIsCollectLoading] = useState(true);
  const [walletSource, setWalletSource] = useState<string | undefined>(
    undefined
  );
  const [error, setError] = useState('');
  const [priceAdjustment, setPriceAdjustment] = useState<number | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null
  );
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [shippingMethods, setShippingMethods] =
    useState<ShippingMethods | null>(null);
  const [shippingMethod, setShippingMethod] = useState<string | null>(null);
  const { poyntExpressRequest } = useBuildPaymentRequest();
  const { data: totals } = useDraftOrderTotals();
  const { data: draftOrder } = useDraftOrder();
  const currencyCode = totals?.total?.currencyCode || 'USD';

  const [godaddyTotals, setGoDaddyTotals] = useState<{
    taxes: { currencyCode: string; value: number };
    shipping: { currencyCode: string; value: number };
  }>({
    taxes: { currencyCode: currencyCode, value: 0 },
    shipping: { currencyCode: currencyCode, value: 0 },
  });
  const form = useFormContext();
  const getShippingMethodsByAddress = useGetShippingMethodByAddress();
  const getTaxes = useGetTaxes();
  const getPriceAdjustments = useGetPriceAdjustments();
  const updateTaxes = useUpdateTaxes();

  const countryCode = session?.shipping?.originAddress?.countryCode || 'US';

  const confirmCheckout = useConfirmCheckout();
  const collect = useRef<TokenizeJs | null>(null);

  const calculateGodaddyExpressTaxes = useCallback(
    async (address: Address | null, currency: string, amount: string) => {
      if (!address) return null;

      const taxesRequest = {
        destination: {
          countryCode: address?.countryCode || 'US',
          postalCode: address?.postalCode || '',
          adminArea2: address?.locality || '',
          adminArea1: address?.administrativeArea || '',
        },
        lines: [
          {
            type: 'SHIPPING' as const,
            subtotalPrice: {
              currencyCode: currency,
              // Wallet APIs provide amounts in major units (e.g., "10.50"), convert to minor units for our API
              value: Number(amount) * 100 || 0,
            },
          },
        ],
      };

      return await getTaxes.mutateAsync(taxesRequest);
    },
    [getTaxes]
  );

  const getSortedShippingMethods = useCallback(
    async ({ shippingAddress: address }: { shippingAddress: Address }) => {
      const shippingMethodsData = await getShippingMethodsByAddress.mutateAsync(
        {
          countryCode: address.countryCode || 'US',
          postalCode: address.postalCode || '',
          adminArea2: address.locality || '',
          adminArea1: address.administrativeArea || '',
        }
      );

      setShippingMethods(shippingMethodsData);

      const orderSubTotal = totals?.subTotal?.value || 0;

      const sortedMethods = filterAndSortShippingMethods({
        shippingMethods: shippingMethodsData || [],
        orderSubTotal,
        experimentalRules: session?.experimental_rules,
      });

      const methods = sortedMethods?.map(method => {
        const shippingMethodPrice = formatCurrency({
          amount: method.cost?.value || 0,
          currencyCode: method.cost?.currencyCode || currencyCode,
          inputInMinorUnits: true,
        });

        return {
          id: method?.displayName?.replace(/\s+/g, '-')?.toLowerCase(),
          label: method.displayName || '',
          detail: method.description
            ? `(${method.description}) ${shippingMethodPrice}`
            : `${shippingMethodPrice}`,
          amount: formatCurrency({
            amount: method.cost?.value || 0,
            currencyCode: method.cost?.currencyCode || currencyCode,
            inputInMinorUnits: true,
            returnRaw: true,
          }),
          amountInMinorUnits: method.cost?.value || 0, // Keep original minor unit value
        };
      });

      return methods;
    },
    [getShippingMethodsByAddress.mutateAsync, session, totals]
  );

  const handleExpressPayClick = useCallback(
    async ({ source }: { source?: 'apple_pay' | 'google_pay' | 'paze' }) => {
      // Track the click event for the specific wallet
      let eventId: TrackingEventId;

      // Create a copy of the poyntExpressRequest object to add coupon information if necessary
      let expressRequest = { ...poyntExpressRequest };

      // If there's an applied coupon code and price adjustment, add it to the request
      if (appliedCouponCode && priceAdjustment !== null) {
        // console.log("[poynt collect] Adding discount to express request", {
        // 	appliedCouponCode,
        // 	priceAdjustment,
        // });
        // Create a new array of lineItems that includes the discount
        const updatedLineItems = [...expressRequest.lineItems];

        // Always add the discount line item, using state variables directly
        updatedLineItems.push({
          label: t.totals.discount,
          amount: formatCurrency({
            amount: -priceAdjustment,
            currencyCode,
            inputInMinorUnits: true,
            returnRaw: true,
          }),
          isPending: false,
        });

        // Calculate the correct total in minor units
        const totalInMinorUnits =
          (totals?.subTotal?.value || 0) - priceAdjustment;

        const totalAmount = formatCurrency({
          amount: totalInMinorUnits,
          currencyCode,
          inputInMinorUnits: true,
          returnRaw: true,
        });

        expressRequest = {
          ...expressRequest,
          lineItems: updatedLineItems,
          total: {
            label: t.payment.orderTotal,
            amount: totalAmount,
            isPending: false,
          },
          couponCode: {
            code: appliedCouponCode,
            label: t.totals.discount,
            amount: formatCurrency({
              amount: -priceAdjustment,
              currencyCode,
              inputInMinorUnits: true,
              returnRaw: true,
            }),
          },
        };
      } else {
        expressRequest = {
          ...expressRequest,
          couponCode: {
            code: '',
            label: '',
            amount: '0.00',
          },
        };
      }

      setWalletSource(source);
      setCheckoutErrors(undefined);

      switch (source) {
        case 'apple_pay':
          eventId = eventIds.expressApplePayClick;
          collect?.current?.startApplePaySession(expressRequest);
          break;
        case 'google_pay':
          eventId = eventIds.expressGooglePayClick;
          collect?.current?.startGooglePaySession(expressRequest);
          break;
        case 'paze':
          eventId = eventIds.pazePayClick;
          collect?.current?.startPazeSession(expressRequest);
          break;
        default:
          return;
      }

      // Track the express checkout click
      track({
        eventId,
        type: TrackingEventType.CLICK,
        properties: {
          paymentType: source,
        },
      });
    },
    [
      poyntExpressRequest,
      appliedCouponCode,
      priceAdjustment,
      t,
      setCheckoutErrors,
    ]
  );

  // Track the status of coupon code fetching with a state variable
  const [couponFetchStatus, setCouponFetchStatus] = useState<
    'idle' | 'fetching' | 'done'
  >('idle');

  useEffect(() => {
    // Skip if we've already loaded this once or have an applied code
    if (couponFetchStatus !== 'idle' || appliedCouponCode !== null) return;

    // Mark that we've started the fetch process
    setCouponFetchStatus('fetching');

    const fetchPriceAdjustments = async () => {
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

      if (discountCodes?.length && discountCodes?.[0]) {
        const result = await getPriceAdjustments.mutateAsync({
          discountCodes: [discountCodes?.[0]],
        });

        if (result) {
          setAppliedCouponCode(discountCodes?.[0]);
          setPriceAdjustment(result);
        }
      }
      // Mark the fetch as complete regardless of whether there were discounts
      setCouponFetchStatus('done');
    };

    if (draftOrder) {
      fetchPriceAdjustments();
    }
  }, [draftOrder, getPriceAdjustments, appliedCouponCode, couponFetchStatus]);

  // Initialize the TokenizeJs instance when the component mounts
  // But only after price adjustments have been fetched
  useLayoutEffect(() => {
    if (
      !collect.current &&
      godaddyPaymentsConfig &&
      isPoyntLoaded &&
      isCollectLoading &&
      !hasMounted.current &&
      draftOrder &&
      couponFetchStatus === 'done'
    ) {
      // console.log("[poynt collect] Initializing TokenizeJs", {
      // 	appliedCouponCode,
      // 	priceAdjustment,
      // });
      // Create coupon config if there's a price adjustment from existing coupon
      let couponConfig:
        | { code: string; label: string; amount: string }
        | undefined;
      if (priceAdjustment && appliedCouponCode) {
        couponConfig = {
          code: appliedCouponCode,
          label: t.totals.discount,
          amount: formatCurrency({
            amount: priceAdjustment,
            currencyCode,
            inputInMinorUnits: true,
            returnRaw: true,
          }),
        };
      }

      // console.log("[poynt collect] TokenizeJsing initialized", {
      // 	couponConfig,
      // });
      collect.current = new (window as any).TokenizeJs(
        session?.businessId || godaddyPaymentsConfig?.businessId,
        godaddyPaymentsConfig?.appId,
        {
          country: countryCode,
          currency: currencyCode,
          merchantName: session?.storeName || '',
          requireEmail: true,
          requireShippingAddress: !!session?.enableShippingAddressCollection,
          supportCouponCode: !!session?.enablePromotionCodes,
          ...(couponConfig ? { couponCode: couponConfig } : {}),
        }
      );
    }
  }, [
    godaddyPaymentsConfig,
    countryCode,
    currencyCode,
    session,
    isPoyntLoaded,
    isCollectLoading,
    priceAdjustment,
    appliedCouponCode,
    draftOrder,
    couponFetchStatus,
    t,
  ]);

  // Reference to track if mounting has already occurred
  const hasMounted = useRef(false);

  // Mount the TokenizeJs instance
  useEffect(() => {
    if (
      !isPoyntLoaded ||
      !godaddyPaymentsConfig ||
      !isCollectLoading ||
      !collect.current ||
      hasMounted.current
    )
      return;

    collect.current?.supportWalletPayments().then(supports => {
      const paymentMethods: string[] = [];
      if (supports.applePay) {
        track({
          eventId: eventIds.expressApplePayImpression,
          type: TrackingEventType.IMPRESSION,
          properties: {
            provider: 'poynt',
          },
        });
        paymentMethods.push('apple_pay');
      }
      if (supports.googlePay) {
        paymentMethods.push('google_pay');
        track({
          eventId: eventIds.expressGooglePayImpression,
          type: TrackingEventType.IMPRESSION,
          properties: {
            provider: 'poynt',
          },
        });
      }
      // if (supports.paze) paymentMethods.push("paze"); // paze is not an "express" payment and needs to be implemented as a standard flow

      if (paymentMethods.length > 0 && !hasMounted.current) {
        hasMounted.current = true;
        // console.log("[poynt collect] Mounting");
        collect?.current?.mount('gdpay-express-pay-element', document, {
          paymentMethods: paymentMethods,
          buttonsContainerOptions: {
            className: 'gap-1 !flex-col sm:!flex-row place-items-center',
          },
          buttonOptions: {
            type: 'plain',
            margin: '0',
            height: '50px',
            width: '100%',
            justifyContent: 'flex-start',
            onClick: handleExpressPayClick,
          },
        });
      }
    });
  }, [
    isPoyntLoaded,
    godaddyPaymentsConfig,
    isCollectLoading,
    handleExpressPayClick,
  ]);

  // Function to convert shipping address to shippingLines format for price adjustments
  const convertAddressToShippingLines = useCallback(
    (
      address: Address | null,
      selectedMethod: { amountInMinorUnits: number; name: string }
    ) => {
      if (!address) return undefined;

      return [
        {
          subTotal: {
            currencyCode: currencyCode,
            value: selectedMethod.amountInMinorUnits,
          },
          name: selectedMethod.name,
        },
      ];
    },
    [currencyCode]
  );

  // Set up event listeners for TokenizeJs
  // Handle coupon code changes
  useEffect(() => {
    if (!collect.current || !isPoyntLoaded) return;

    collect.current.on('close_wallet', () => {
      // console.log("[poynt collect] Wallet closed");

      // Reset the state when wallet is closed to ensure fresh state when reopening
      // Reset coupon fetch status to trigger a re-fetch on next open
      setCouponFetchStatus('idle');
      setAppliedCouponCode(null);

      // Clear any error messages
      setError('');

      // Reset shipping-related state
      setShippingAddress(null);
      setShippingMethods(null);
      setShippingMethod(null);

      // Reset totals for a fresh calculation
      setGoDaddyTotals({
        taxes: { currencyCode: currencyCode, value: 0 },
        shipping: { currencyCode: currencyCode, value: 0 },
      });

      form.reset(
        mapOrderToFormValues({
          order: draftOrder,
          defaultCountryCode: session?.shipping?.originAddress?.countryCode,
        })
      );

      if (session?.enableTaxCollection && draftOrder?.shipping?.address) {
        try {
          updateTaxes.mutate(undefined);
        } catch (_error) {
          // Silently handle tax clearing errors on wallet close
        }
      }
    });

    collect.current.on('coupon_code_change', async e => {
      const couponCode = e.couponCode;
      let updatedOrder: WalletRequestUpdate = {};

      // Track the event
      track({
        eventId: couponCode
          ? eventIds.expressApplyCouponEvent
          : eventIds.expressRemoveCouponEvent,
        type: TrackingEventType.EVENT,
        properties: {
          couponCode: couponCode || 'removed',
        },
      });

      // Start with the base line items
      const baseLineItems = [...poyntExpressRequest.lineItems];

      if (!couponCode) {
        // User removed the coupon code
        setAppliedCouponCode(null);
        setPriceAdjustment(null);

        // Add shipping and taxes if they exist
        const finalLineItems = [...baseLineItems];

        if (godaddyTotals.shipping.value > 0) {
          finalLineItems.push({
            label: 'Shipping',
            amount: formatCurrency({
              amount: godaddyTotals.shipping.value,
              currencyCode,
              inputInMinorUnits: true,
              returnRaw: true,
            }),
          });
        }

        if (godaddyTotals.taxes.value > 0) {
          finalLineItems.push({
            label: t.totals.estimatedTaxes,
            amount: formatCurrency({
              amount: godaddyTotals.taxes.value,
              currencyCode,
              inputInMinorUnits: true,
              returnRaw: true,
            }),
          });
        }

        // Calculate the total in minor units then format with proper currency precision
        const totalInMinorUnits =
          (totals?.subTotal?.value || 0) +
          godaddyTotals.shipping.value +
          godaddyTotals.taxes.value;

        const totalAmount = formatCurrency({
          amount: totalInMinorUnits,
          currencyCode,
          inputInMinorUnits: true,
          returnRaw: true,
        });

        updatedOrder = {
          lineItems: finalLineItems,
          total: {
            label: t.payment.orderTotal,
            amount: totalAmount,
          },
          couponCode: {
            code: '',
            label: '',
            amount: '0.00',
          },
        };
      } else {
        // User added or changed coupon code
        try {
          // Build the shippingLines if we have shipping address info
          let shippingLines: ReturnType<typeof convertAddressToShippingLines>;
          if (shippingAddress && shippingMethod) {
            const selectedMethodInfo = {
              amountInMinorUnits: godaddyTotals.shipping.value,
              name: shippingMethod,
            };
            shippingLines = convertAddressToShippingLines(
              shippingAddress,
              selectedMethodInfo
            );
          }

          // Call the price adjustments mutation with the new coupon code
          const adjustment = await getPriceAdjustments.mutateAsync({
            discountCodes: [couponCode],
            shippingLines,
          });

          if (adjustment) {
            setAppliedCouponCode(couponCode);
            setPriceAdjustment(adjustment);

            // Build line items with shipping, taxes, and the new discount
            const finalLineItems = [...baseLineItems];

            if (godaddyTotals.shipping.value > 0) {
              finalLineItems.push({
                label: t.totals.shipping,
                amount: formatCurrency({
                  amount: godaddyTotals.shipping.value,
                  currencyCode,
                  inputInMinorUnits: true,
                  returnRaw: true,
                }),
              });
            }

            if (godaddyTotals.taxes.value > 0) {
              finalLineItems.push({
                label: t.totals.estimatedTaxes,
                amount: formatCurrency({
                  amount: godaddyTotals.taxes.value,
                  currencyCode,
                  inputInMinorUnits: true,
                  returnRaw: true,
                }),
              });
            }

            // Add the discount line item
            finalLineItems.push({
              label: t.totals.discount,
              amount: formatCurrency({
                amount: -adjustment,
                currencyCode,
                inputInMinorUnits: true,
                returnRaw: true,
              }),
            });

            // Calculate the total in minor units then format with proper currency precision
            const totalInMinorUnits =
              (totals?.subTotal?.value || 0) +
              godaddyTotals.shipping.value +
              godaddyTotals.taxes.value -
              adjustment;

            const totalAmount = formatCurrency({
              amount: totalInMinorUnits,
              currencyCode,
              inputInMinorUnits: true,
              returnRaw: true,
            });

            updatedOrder = {
              lineItems: finalLineItems,
              total: {
                label: t.payment.orderTotal,
                amount: totalAmount,
              },
              couponCode: {
                code: couponCode,
                label: t.totals.discount,
                amount: formatCurrency({
                  amount: -adjustment,
                  currencyCode,
                  inputInMinorUnits: true,
                  returnRaw: true,
                }),
              },
            };
          } else {
            // Adjustment was zero or error occurred
            // Track the coupon error event
            track({
              eventId: eventIds.discountError,
              type: TrackingEventType.EVENT,
              properties: {
                success: false,
                errorType: 'invalid_coupon',
                couponCode,
                errorCodes: 'invalid_coupon_code',
              },
            });

            updatedOrder = {
              error: {
                code: 'invalid_coupon_code',
                message: `Coupon code ${couponCode} is not valid or cannot be applied`,
              },
            };
          }
        } catch (err) {
          // Track the coupon application error
          track({
            eventId: eventIds.discountError,
            type: TrackingEventType.EVENT,
            properties: {
              success: false,
              errorType: 'coupon_application_error',
              couponCode,
              errorCodes: err instanceof Error ? err.name : 'unknown',
            },
          });

          updatedOrder = {
            error: {
              code: 'invalid_coupon_code',
              message: `Could not apply coupon code ${couponCode}`,
            },
          };
        }
      }

      // Update the wallet with the new order information
      // console.log("[poynt collect] Updating order with", { updatedOrder });
      e.updateWith(updatedOrder);
    });

    collect.current.on('payment_authorized', async event => {
      const nonce = event?.nonce;

      const selectedShippingMethod = shippingMethods?.find(
        method => method.displayName === shippingMethod
      );

      if (nonce) {
        // Include coupon code if one is applied
        const checkoutBody = {
          paymentToken: nonce,
          paymentType: event?.source,
          paymentProvider: PaymentProvider.POYNT,
          isExpress: true,
          ...(godaddyTotals.shipping
            ? {
                shippingTotal: godaddyTotals.shipping,
              }
            : {}),
          ...(godaddyTotals.taxes
            ? {
                taxTotal: {
                  value: godaddyTotals.taxes.value,
                  currencyCode: godaddyTotals.taxes.currencyCode,
                },
              }
            : {}),
          ...(event?.billingAddress
            ? {
                billing: {
                  email: event.billingAddress.emailAddress || '',
                  phone: event.billingAddress.phoneNumber || '',
                  firstName: event.billingAddress.name?.split(' ')?.[0] || '',
                  lastName: event.billingAddress.name
                    ? event.billingAddress.name.split(' ').slice(1).join(' ') ||
                      ''
                    : '',
                  address: {
                    countryCode: event.billingAddress.countryCode || '',
                    postalCode: event.billingAddress.postalCode || '',
                    adminArea1: event.billingAddress.administrativeArea || '',
                    adminArea2: event.billingAddress.locality || '',
                    addressLine1: event.billingAddress.addressLines?.[0] || '',
                    addressLine2: event.billingAddress.addressLines?.[1] || '',
                  },
                },
              }
            : {}),
          ...(event?.shippingAddress
            ? {
                shipping: {
                  email: event?.shippingAddress?.emailAddress || '',
                  phone: event?.shippingAddress?.phoneNumber || '',
                  firstName: event.shippingAddress.name?.split(' ')?.[0] || '',
                  lastName: event.shippingAddress.name
                    ? event.shippingAddress.name
                        .split(' ')
                        .slice(1)
                        .join(' ') || ''
                    : '',
                  address: {
                    countryCode: event?.shippingAddress?.countryCode || '',
                    postalCode: event?.shippingAddress?.postalCode || '',
                    adminArea1: event.shippingAddress?.administrativeArea || '',
                    adminArea2: event?.shippingAddress?.locality || '',
                    addressLine1:
                      event?.shippingAddress?.addressLines?.[0] || '',
                    addressLine2:
                      event?.shippingAddress?.addressLines?.[1] || '',
                  },
                },
              }
            : {}),
          ...(selectedShippingMethod
            ? {
                shippingLines: [
                  {
                    amount: godaddyTotals.shipping,
                    name: selectedShippingMethod?.displayName || '',
                    requestedProvider:
                      selectedShippingMethod?.carrierCode || '',
                    requestedService: selectedShippingMethod?.serviceCode || '',
                    totals: {
                      subTotal: godaddyTotals.shipping,
                      taxTotal: {
                        value: 0,
                        currencyCode: currencyCode,
                      },
                    },
                  },
                ],
              }
            : {}),
        };

        try {
          await confirmCheckout.mutateAsync(checkoutBody);

          event.complete();
        } catch (err: unknown) {
          if (err instanceof GraphQLErrorWithCodes) {
            const walletError: WalletError = {
              code: 'invalid_payment_data',
              message:
                t.apiErrors?.[err.codes[0] as keyof typeof t.apiErrors] ||
                t.errors.errorProcessingPayment,
            };

            // Track payment error
            track({
              eventId: eventIds.expressCheckoutError,
              type: TrackingEventType.EVENT,
              properties: {
                paymentType: event.source,
                provider: 'poynt',
                errorCodes: err.codes.join(','),
              },
            });

            event.complete({ error: walletError });
          } else {
            // Track generic payment error
            track({
              eventId: eventIds.expressCheckoutError,
              type: TrackingEventType.EVENT,
              properties: {
                paymentType: event.source,
                provider: 'poynt',
                errorType: 'generic',
              },
            });

            const walletError: WalletError = {
              code: 'invalid_payment_data',
              message: t.errors.errorProcessingPayment,
            };
            event.complete({ error: walletError });
          }
        }
      } else {
        track({
          eventId: eventIds.expressCheckoutError,
          type: TrackingEventType.EVENT,
          properties: {
            paymentType: event.source,
            provider: 'poynt',
            errorCodes: 'no_nonce',
          },
        });
        const walletError: WalletError = {
          code: 'invalid_payment_data',
          message: t.errors.errorProcessingPayment,
        };
        event.complete({ error: walletError });
      }
    });

    collect.current.on('ready', () => {
      setIsCollectLoading(false);
    });

    collect.current.on('error', event => {
      setError(event?.data?.error?.message || t.errors.errorProcessingPayment);
    });

    collect.current.on('shipping_method_change', async e => {
      let updatedOrder: PoyntExpressRequest = poyntExpressRequest;
      const poyntLineItems = [...poyntExpressRequest.lineItems];

      // Handle shipping method change
      if (e.shippingMethod && shippingAddress) {
        // Wallet API provides shipping amount in major units (e.g., "10.50")
        const shippingAmount = e.shippingMethod?.amount;

        poyntLineItems.push({
          label: t.totals.shipping,
          amount: shippingAmount || '0',
          isPending: false,
        });
        setGoDaddyTotals(value => ({
          ...value,
          shipping: {
            currencyCode: currencyCode,
            // Convert wallet API amount from major to minor units for internal storage
            value: Number(shippingAmount) * 100 || 0,
          },
        }));

        // If there's an applied coupon, recalculate price adjustments with the new shipping method
        if (appliedCouponCode) {
          try {
            const shippingLines = convertAddressToShippingLines(
              shippingAddress,
              {
                // Convert wallet API amount from major to minor units for API request
                amountInMinorUnits: Number(shippingAmount) * 100 || 0,
                name: e.shippingMethod?.label || t.totals.shipping,
              }
            );

            const newAdjustments = await getPriceAdjustments.mutateAsync({
              discountCodes: [appliedCouponCode],
              shippingLines,
            });

            if (newAdjustments) {
              setPriceAdjustment(newAdjustments);
            } else {
              setPriceAdjustment(null);
              setAppliedCouponCode('');
            }
          } catch (err) {
            // Track error with price adjustment calculation for shipping method
            track({
              eventId: eventIds.discountError,
              type: TrackingEventType.EVENT,
              properties: {
                success: false,
                errorType: 'shipping_method_price_adjustment_error',
                couponCode: appliedCouponCode,
                errorCodes: err instanceof Error ? err.name : 'unknown',
                shippingMethod: e.shippingMethod?.label || '',
              },
            });
          }
        }

        if (session?.enableTaxCollection) {
          try {
            const taxesResult = await calculateGodaddyExpressTaxes(
              shippingAddress,
              currencyCode,
              shippingAmount || '0'
            );

            if (taxesResult?.value) {
              poyntLineItems.push({
                label: t.totals.estimatedTaxes,
                amount: formatCurrency({
                  amount: taxesResult.value,
                  currencyCode,
                  inputInMinorUnits: true,
                  returnRaw: true,
                }),
                isPending: false,
              });
              setGoDaddyTotals(value => ({
                ...value,
                taxes: {
                  currencyCode: currencyCode,
                  value: taxesResult.value || 0,
                },
              }));
            }
          } catch (_error) {
            if (walletSource !== 'apple_pay') {
              e.updateWith({
                error: {
                  code: 'unknown',
                  message: t.apiErrors.TAX_CALCULATION_ERROR,
                },
              });
              return;
            }
            setCheckoutErrors([t.apiErrors.TAX_CALCULATION_ERROR]);
            collect?.current?.abortApplePaySession();
            return;
          }
        }

        // Add discount line if a coupon is applied
        if (priceAdjustment && appliedCouponCode) {
          poyntLineItems.push({
            label: t.totals.discount,
            amount: formatCurrency({
              amount: -priceAdjustment,
              currencyCode,
              inputInMinorUnits: true,
              returnRaw: true,
            }),
            isPending: false,
          });
        }

        const totalAmount = poyntLineItems.reduce(
          (acc, item) => acc + Number(item.amount),
          0
        );

        updatedOrder = {
          ...updatedOrder,
          total: {
            label: t.payment.orderTotal,
            amount: totalAmount.toString(),
          },
          lineItems: poyntLineItems,
        };

        // Add coupon code to the request if one is applied
        if (appliedCouponCode && priceAdjustment !== null) {
          updatedOrder.couponCode = {
            code: appliedCouponCode,
            label: t.totals.discount,
            amount: formatCurrency({
              amount: -priceAdjustment,
              currencyCode,
              inputInMinorUnits: true,
              returnRaw: true,
            }),
          };
        }

        e.updateWith(updatedOrder as WalletRequestUpdate);
      }
    });

    collect.current.on('shipping_address_change', async e => {
      let updatedOrder: PoyntExpressRequest = poyntExpressRequest;
      const poyntLineItems = [...poyntExpressRequest.lineItems];

      // Update the shipping address in the draft order
      if (e.shippingAddress) {
        // console.log("[poynt collect] Shipping address change", {
        // 	shippingAddress: e.shippingAddress,
        // });
        setShippingAddress(e.shippingAddress);

        const methods = await getSortedShippingMethods({
          shippingAddress: e.shippingAddress,
        });

        if (methods[0]) {
          setShippingMethod(methods[0]?.label || null);

          setGoDaddyTotals(value => ({
            ...value,
            shipping: {
              currencyCode: currencyCode,
              value: methods?.[0]?.amountInMinorUnits || 0,
            },
          }));

          poyntLineItems.push({
            label: t.totals.shipping,
            amount: methods?.[0]?.amount || '0',
            isPending: false,
          });

          // console.log("[poynt collect] setting shipping method!", {
          // 	method: methods[0],
          // });

          // If there's an applied coupon, recalculate price adjustments with the new shipping
          if (appliedCouponCode) {
            try {
              const shippingLines = convertAddressToShippingLines(
                e.shippingAddress,
                {
                  amountInMinorUnits: methods[0]?.amountInMinorUnits || 0,
                  name: methods[0]?.label || t.totals.shipping,
                }
              );

              const newAdjustments = await getPriceAdjustments.mutateAsync({
                discountCodes: [appliedCouponCode],
                shippingLines,
              });

              if (newAdjustments) {
                setPriceAdjustment(newAdjustments);
              } else {
                setPriceAdjustment(null);
                setAppliedCouponCode('');
              }
            } catch (err) {
              // Track error with price adjustment calculation for shipping address
              track({
                eventId: eventIds.discountError,
                type: TrackingEventType.EVENT,
                properties: {
                  success: false,
                  errorType: 'shipping_price_adjustment_error',
                  couponCode: appliedCouponCode,
                  errorCodes: err instanceof Error ? err.name : 'unknown',
                  shippingMethod: methods[0]?.label || '',
                },
              });
            }
          }
        } else {
          e.updateWith({
            error: {
              code: 'invalid_shipping_address',
              message: t.shipping.noShippingMethods,
            },
          });
          setGoDaddyTotals(value => ({
            ...value,
            shipping: {
              currencyCode: currencyCode,
              value: 0,
            },
          }));
        }

        if (session?.enableTaxCollection) {
          try {
            // console.log("[poynt collect] getting taxes!");
            const taxesResult = await calculateGodaddyExpressTaxes(
              e.shippingAddress,
              currencyCode,
              methods?.[0]?.amount
            );

            // console.log("[poynt collect] Taxes result", { taxesResult });

            if (taxesResult?.value) {
              poyntLineItems.push({
                label: t.totals.estimatedTaxes,
                amount: formatCurrency({
                  amount: taxesResult.value,
                  currencyCode,
                  inputInMinorUnits: true,
                  returnRaw: true,
                }),
                isPending: false,
              });
              setGoDaddyTotals(value => ({
                ...value,
                taxes: {
                  currencyCode: currencyCode,
                  value: taxesResult.value || 0,
                },
              }));
            }
          } catch (_error) {
            // console.log("[poynt collect] Caught tax calculation error:", {
            // 	error,
            // });
            if (walletSource !== 'apple_pay') {
              e.updateWith({
                error: {
                  code: 'unknown',
                  message: t.apiErrors.TAX_CALCULATION_ERROR,
                },
              });
              return;
            }
            setCheckoutErrors([t.apiErrors.TAX_CALCULATION_ERROR]);
            collect?.current?.abortApplePaySession();
            return;
          }
        }

        // Add discount line if a coupon is applied
        if (priceAdjustment && appliedCouponCode) {
          poyntLineItems.push({
            label: t.totals.discount,
            amount: formatCurrency({
              amount: -priceAdjustment,
              currencyCode,
              inputInMinorUnits: true,
              returnRaw: true,
            }),
            isPending: false,
          });
        }

        const totalAmount = poyntLineItems.reduce(
          (acc, item) => acc + Number(item.amount),
          0
        );

        updatedOrder = {
          ...poyntExpressRequest,
          total: {
            label: t.payment.orderTotal,
            amount: totalAmount.toString(),
          },
          shippingMethods: methods as ShippingMethod[],
          lineItems: poyntLineItems,
        };

        // Add coupon code to the request if one is applied
        if (appliedCouponCode && priceAdjustment !== null) {
          updatedOrder.couponCode = {
            code: appliedCouponCode,
            label: appliedCouponCode || 'Discount',
            amount: formatCurrency({
              amount: -priceAdjustment,
              currencyCode,
              inputInMinorUnits: true,
              returnRaw: true,
            }),
          };
        } else {
          updatedOrder.couponCode = {
            code: '',
            label: '',
            amount: '0.00',
          };
        }

        // console.log(
        // 	"[poynt collect] Shipping address change - updating wallet",
        // 	{ updatedOrder },
        // );

        e.updateWith(updatedOrder);
      }
    });

    // return function unmount() {
    // 	if (collect.current) {
    // 		console.log("poynt collect unmounting");
    // 		collect.current.unmount("gdpay-express-pay-element", document);
    // 	}
    // };
  }, [
    isPoyntLoaded,
    shippingAddress,
    shippingMethod,
    shippingMethods,
    godaddyTotals,
    poyntExpressRequest,
    currencyCode,
    confirmCheckout.mutateAsync,
    t.errors.errorProcessingPayment,
    t.apiErrors,
    calculateGodaddyExpressTaxes,
    getSortedShippingMethods,
    convertAddressToShippingLines,
    getPriceAdjustments.mutateAsync,
    priceAdjustment,
    appliedCouponCode,
    t,
    form,
    draftOrder,
    session,
    updateTaxes.mutate,
    walletSource,
    setCheckoutErrors,
  ]);

  return (
    <>
      <div id='gdpay-express-pay-element' />
      {isCollectLoading ? (
        <div className='grid gap-1 grid-cols-1 sm:grid-cols-2'>
          <Skeleton className='h-12 w-full mb-1' />
          <Skeleton className='h-12 w-full mb-1' />
        </div>
      ) : null}
      {error ? <p className='text-destructive py-1'>{error}</p> : null}
    </>
  );
}
