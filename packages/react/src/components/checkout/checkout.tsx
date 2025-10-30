'use client';

import React, { type ReactNode } from 'react';
import { z } from 'zod';
import { hasRegionData } from '@/components/checkout/address';
import { checkIsValidPhone } from '@/components/checkout/address/utils/check-is-valid-phone';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import { getRequiredFieldsFromSchema } from '@/components/checkout/form/utils/get-required-fields-from-schema';
import { type GoDaddyVariables, useGoDaddyContext } from '@/godaddy-provider';
import { type Theme, useTheme } from '@/hooks/use-theme';
import { useVariables } from '@/hooks/use-variables';
import type { TrackingProperties } from '@/tracking/event-properties';
import { TrackingProvider } from '@/tracking/tracking-provider';
import type { CheckoutSession } from '@/types';
import { CheckoutFormContainer } from './form/checkout-form-container';
import type { Target } from './target/target';

// Utility function for redirecting to success URL after checkout
export function redirectToSuccessUrl(successUrl?: string): void {
  if (successUrl && typeof window !== 'undefined') {
    setTimeout(() => {
      window.location.href = successUrl;
    }, 1000);
  }
}

export interface CheckoutElements {
  input?: string;
  select?: string;
  button?: string;
  card?: string;
  checkbox?: string;
  radio?: string;
}

interface Appearance {
  theme?: Theme;
  elements?: CheckoutElements;
  variables?: Omit<GoDaddyVariables, 'checkout'>;
}

export type LayoutSection = 'express-checkout' | 'contact' | 'shipping' | 'payment' | 'pickup' | 'tips' | 'delivery';

export const LayoutSections = {
  EXPRESS_CHECKOUT: 'express-checkout',
  CONTACT: 'contact',
  SHIPPING: 'shipping',
  PAYMENT: 'payment',
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  TIPS: 'tips',
} as const;

export type StripeConfig = {
  publishableKey: string;
  testMode?: boolean;
};

export type GodaddyPaymentsConfig = {
  businessId: string;
  appId: string;
};

export type SquareConfig = {
  locationId: string;
  appId: string;
};

export type PayPalConfig = {
  clientId: string;
  disableFunding?: Array<'credit' | 'card' | 'paylater' | 'venmo'>;
};

interface CheckoutContextValue {
  elements?: CheckoutElements;
  targets?: Partial<Record<Target, () => ReactNode>>;
  session?: CheckoutSession;
  isCheckoutDisabled?: boolean;
  stripeConfig?: StripeConfig;
  godaddyPaymentsConfig?: GodaddyPaymentsConfig;
  squareConfig?: SquareConfig;
  paypalConfig?: PayPalConfig;
  isConfirmingCheckout: boolean;
  setIsConfirmingCheckout: (isConfirming: boolean) => void;
  checkoutErrors?: string[] | undefined;
  setCheckoutErrors: (error?: string[] | undefined) => void;
  requiredFields?: { [key: string]: boolean };
}

export const checkoutContext = React.createContext<CheckoutContextValue>({
  isConfirmingCheckout: false,
  setIsConfirmingCheckout: () => {
    // no op
  },
  checkoutErrors: undefined,
  setCheckoutErrors: () => {
    // no op
  },
});

export const useCheckoutContext = () => React.useContext(checkoutContext);

export const baseCheckoutSchema = z.object({
  contactEmail: z.string().min(1, 'Enter an email').email('Enter a valid email'),
  deliveryMethod: z.nativeEnum(DeliveryMethods).describe('fulfillmentModes'),
  paymentUseShippingAddress: z.boolean().default(true),
  shippingFirstName: z.string().max(60),
  shippingLastName: z.string().max(60),
  shippingPhone: z.string().max(15, 'Phone number too long').optional(),
  shippingAddressLine1: z.string().max(300),
  shippingAddressLine2: z.string().max(300).optional(),
  shippingAddressLine3: z.string().max(300).optional(),
  shippingAdminArea4: z.string().max(100).describe('The neighborhood').optional(),
  shippingAdminArea3: z.string().max(100).describe('City, town, or village').optional(),
  shippingAdminArea2: z.string().max(100).describe('Sub-locality or suburb'),
  shippingAdminArea1: z.string().max(100).describe('State or province'),
  shippingPostalCode: z.string().max(60),
  shippingCountryCode: z.string().max(2),
  shippingMethod: z.string().optional(),
  shippingValid: z.literal(true, {
    errorMap: () => ({ message: 'Invalid shipping address' }),
  }),
  billingFirstName: z.string().max(60),
  billingLastName: z.string().max(60),
  billingPhone: z.string().max(15, 'Phone number too long').optional(),
  billingAddressLine1: z.string().max(300),
  billingAddressLine2: z.string().max(300).optional(),
  billingAddressLine3: z.string().max(300).optional(),
  billingAdminArea4: z.string().max(100).describe('The neighborhood').optional(),
  billingAdminArea3: z.string().max(100).describe('City, town, or village').optional(),
  billingAdminArea2: z.string().max(100).describe('Sub-locality or suburb'),
  billingAdminArea1: z.string().max(100).describe('State or province'),
  billingPostalCode: z.string().max(60),
  billingCountryCode: z.string().max(2),
  billingValid: z.literal(true, {
    errorMap: () => ({ message: 'Invalid billing address' }),
  }),
  paymentCardNumber: z.string().optional(),
  paymentCardNumberDisplay: z.string().optional(),
  paymentCardType: z.string().optional(),
  paymentExpiryDate: z.string().optional(),
  paymentMonth: z.string().nullish(),
  paymentYear: z.string().nullish(),
  paymentSecurityCode: z.string().optional(),
  paymentNameOnCard: z.string().optional(),
  notes: z.string().optional(),
  pickupDate: z.union([z.string(), z.date()]).nullish(),
  pickupTime: z.string().nullish(),
  pickupLocationId: z.string().nullish(),
  pickupLeadTime: z.number().nullish(),
  pickupTimezone: z.string().nullish(),
  tipAmount: z.number().optional(),
  tipPercentage: z.number().optional(),
  paymentMethod: z.string().min(1, 'Select a payment method'),
  stripePaymentIntent: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
}); // We cannot use refine here, as it would not allow extending the schema with session overrides.

export type CheckoutFormSchema = {
  [K in keyof z.infer<typeof baseCheckoutSchema>]?: z.ZodTypeAny;
} & {
  [key: string]: z.ZodTypeAny;
};

export type CheckoutFormData = z.infer<typeof baseCheckoutSchema>;

export interface CheckoutProps {
  session: CheckoutSession | undefined;
  appearance?: Appearance;
  isCheckoutDisabled?: boolean;
  stripeConfig?: StripeConfig;
  godaddyPaymentsConfig?: GodaddyPaymentsConfig;
  squareConfig?: SquareConfig;
  paypalConfig?: PayPalConfig;
  layout?: LayoutSection[];
  direction?: 'ltr' | 'rtl';
  showStoreHours?: boolean;
  enableTracking?: boolean;
  trackingProperties?: TrackingProperties;
  targets?: Partial<Record<Target, () => ReactNode>>;
  checkoutFormSchema?: CheckoutFormSchema;
  defaultValues?: Pick<CheckoutFormData, 'contactEmail'>;
}

export function Checkout(props: CheckoutProps) {
  const {
    session,
    checkoutFormSchema,
    enableTracking = false,
    trackingProperties,
    stripeConfig,
    godaddyPaymentsConfig,
    squareConfig,
    paypalConfig,
    isCheckoutDisabled,
  } = props;

  const [isConfirmingCheckout, setIsConfirmingCheckout] = React.useState(false);
  const [checkoutErrors, setCheckoutErrors] = React.useState<string[] | undefined>(undefined);
  const { t } = useGoDaddyContext();

  useTheme();
  useVariables(props?.appearance?.variables);

  const formSchema = React.useMemo(() => {
    const extendedSchema = checkoutFormSchema ? baseCheckoutSchema.extend(checkoutFormSchema) : baseCheckoutSchema;

    return extendedSchema.superRefine((data, ctx) => {
      if (data.billingPhone) {
        if (!checkIsValidPhone(String(data?.billingPhone))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Enter a valid billing phone number',
            path: ['billingPhone'],
          });
        }
      }

      if (data.shippingPhone) {
        if (!checkIsValidPhone(String(data?.shippingPhone))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Enter a valid shipping phone number',
            path: ['shippingPhone'],
          });
        }
      }

      // Billing address validation - only required if not using shipping address OR pickup
      const requireBillingAddress = !data.paymentUseShippingAddress || data.deliveryMethod === DeliveryMethods.PICKUP;

      if (requireBillingAddress) {
        // Basic billing fields required for all countries
        const billingFields = [
          { key: 'billingFirstName', message: t.validation.enterFirstName },
          { key: 'billingLastName', message: t.validation.enterLastName },
          { key: 'billingAddressLine1', message: t.validation.enterAddress },
          { key: 'billingAdminArea2', message: t.validation.enterCity },
          {
            key: 'billingPostalCode',
            message: t.validation.enterZipPostalCode,
          },
          { key: 'billingCountryCode', message: t.validation.enterCountry },
        ];

        if (hasRegionData(String(data.billingCountryCode))) {
          billingFields.push({
            key: 'billingAdminArea1',
            message: t.validation.selectState,
          });
        }

        for (const { key, message } of billingFields) {
          if (!data[key as keyof typeof data]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message,
              path: [key],
            });
          }
        }
      }

      // Shipping address validation - only required if delivery method is SHIP
      const requireShippingAddress = data.deliveryMethod === DeliveryMethods.SHIP;

      if (requireShippingAddress) {
        // Basic shipping fields required for all countries
        const shippingFields = [
          { key: 'shippingFirstName', message: t.validation.enterFirstName },
          { key: 'shippingLastName', message: t.validation.enterLastName },
          { key: 'shippingAddressLine1', message: t.validation.enterAddress },
          { key: 'shippingAdminArea2', message: t.validation.enterCity },
          {
            key: 'shippingPostalCode',
            message: t.validation.enterZipPostalCode,
          },
          { key: 'shippingCountryCode', message: t.validation.enterCountry },
        ];

        if (hasRegionData(String(data.shippingCountryCode))) {
          shippingFields.push({
            key: 'shippingAdminArea1',
            message: t.validation.selectState,
          });
        }

        for (const { key, message } of shippingFields) {
          if (!data[key as keyof typeof data]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message,
              path: [key],
            });
          }
        }
      }
    });
  }, [checkoutFormSchema, t]);
  // }, [checkoutFormSchema, session?.paymentMethods]);

  const requiredFields = React.useMemo(() => {
    return getRequiredFieldsFromSchema(formSchema);
  }, [formSchema]);

  return (
    <TrackingProvider session={session} trackingEnabled={enableTracking && !!session?.id} trackingProperties={trackingProperties}>
      <checkoutContext.Provider
        value={{
          elements: props?.appearance?.elements,
          targets: props?.targets,
          isCheckoutDisabled,
          session,
          stripeConfig,
          godaddyPaymentsConfig,
          squareConfig,
          paypalConfig,
          requiredFields,
          isConfirmingCheckout,
          setIsConfirmingCheckout,
          checkoutErrors,
          setCheckoutErrors,
        }}
      >
        <CheckoutFormContainer {...props} schema={formSchema} direction={props.direction} />
      </checkoutContext.Provider>
    </TrackingProvider>
  );
}
