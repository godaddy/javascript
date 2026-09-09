import { useMemo } from 'react';
import {
  type CheckoutProps,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { CheckoutSkeleton } from '@/components/checkout/checkout-skeleton';
import { CheckoutForm } from '@/components/checkout/form/checkout-form';
import type { CheckoutValidationAdapter } from '@/components/checkout/form/checkout-validation-adapter';
import {
  useDraftOrder,
  useDraftOrderLineItems,
} from '@/components/checkout/order/use-draft-order';
import {
  useDraftOrderProductsMap,
  useRefreshProductsWhenLineItemsChange,
} from '@/components/checkout/order/use-draft-order-products';
import {
  mapOrderToFormValues,
  mapSkusToItemsDisplay,
} from '@/components/checkout/utils/checkout-transformers';
import { getFulfillmentSummary } from '@/components/checkout/utils/fulfillment';

interface CheckoutFormContainerProps extends Omit<CheckoutProps, 'session'> {
  validationAdapter: CheckoutValidationAdapter;
  isLoadingJWT?: boolean;
}

export function CheckoutFormContainer({
  validationAdapter,
  isLoadingJWT,
  ...props
}: CheckoutFormContainerProps) {
  const { session, isConfirmingCheckout } = useCheckoutContext();

  const draftOrderQuery = useDraftOrder();
  const draftOrderLineItemsQuery = useDraftOrderLineItems();
  const skusMap = useDraftOrderProductsMap();

  const { data: order } = draftOrderQuery;
  const { data: lineItems } = draftOrderLineItemsQuery;
  useRefreshProductsWhenLineItemsChange(lineItems);

  const items = useMemo(
    () => mapSkusToItemsDisplay(lineItems, skusMap),
    [lineItems, skusMap]
  );
  const fulfillmentSummary = useMemo(
    () => getFulfillmentSummary(lineItems ?? order?.lineItems),
    [lineItems, order?.lineItems]
  );

  const formValues = useMemo(
    () => ({
      ...mapOrderToFormValues({
        order,
        defaultValues: props.defaultValues,
        defaultCountryCode: session?.shipping?.originAddress?.countryCode,
        enableShipping: session?.enableShipping,
        enableLocalPickup: session?.enableLocalPickup,
      }),
    }),
    [
      order,
      props.defaultValues,
      session?.shipping?.originAddress?.countryCode,
      session?.enableShipping,
      session?.enableLocalPickup,
    ]
  );

  if (!isConfirmingCheckout && !draftOrderQuery.isLoading && !order) {
    const returnUrl = session?.returnUrl;
    if (returnUrl) {
      window.location.href = returnUrl;
      return null;
    }
  }

  if (props.isLoading || draftOrderQuery.isLoading || isLoadingJWT) {
    return (
      props.loadingFallback ?? <CheckoutSkeleton direction={props.direction} />
    );
  }

  return (
    <CheckoutForm
      {...props}
      validationAdapter={validationAdapter}
      items={items}
      fulfillmentSummary={fulfillmentSummary}
      defaultValues={formValues}
      direction={props.direction}
    />
  );
}
