'use client';

import { CircleAlert } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { z } from 'zod';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { getRequiredFieldsFromSchema } from '@/components/checkout/form/utils/get-required-fields-from-schema';
import { type GoDaddyVariables, useGoDaddyContext } from '@/godaddy-provider';
import { useCheckoutSession } from '@/hooks/use-checkout-session';
import { type Theme, useTheme } from '@/hooks/use-theme';
import { useVariables } from '@/hooks/use-variables';
import type { TrackingProperties } from '@/tracking/event-properties';
import { TrackingProvider } from '@/tracking/tracking-provider';
import { type CheckoutSession } from '@/types';
import { CheckoutFormContainer } from './form/checkout-form-container';
import {
  type CheckoutValidationMessages,
  createCheckoutValidationAdapter,
} from './form/checkout-validation-adapter';
import type { Target } from './target/types';

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

export type LayoutSection =
  | 'express-checkout'
  | 'contact'
  | 'shipping'
  | 'payment'
  | 'pickup'
  | 'tips'
  | 'delivery'
  | 'notes';

export const LayoutSections = {
  EXPRESS_CHECKOUT: 'express-checkout',
  CONTACT: 'contact',
  SHIPPING: 'shipping',
  PAYMENT: 'payment',
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  TIPS: 'tips',
  NOTES: 'notes',
} as const;

export type StripeConfig = {
  publishableKey: string;
  testMode?: boolean;
};

export type GodaddyPaymentsConfig = {
  businessId?: string;
  appId?: string;
};

export type SquareConfig = {
  locationId: string;
  appId: string;
};

export type PayPalConfig = {
  clientId: string;
  merchantId?: string;
  disableFunding?: Array<'credit' | 'card' | 'paylater' | 'venmo'>;
};

export type MercadoPagoConfig = {
  publicKey: string;
  country: 'AR' | 'BR' | 'CO' | 'CL' | 'PE' | 'MX';
};

export type CCAvenueConfig = {
  accessCodeId: string;
};

interface CheckoutContextValue {
  elements?: CheckoutElements;
  targets?: Partial<
    Record<Target, (session?: CheckoutSession | null) => ReactNode>
  >;
  session?: CheckoutSession | null;
  jwt?: string;
  isCheckoutDisabled?: boolean;
  stripeConfig?: StripeConfig;
  godaddyPaymentsConfig?: GodaddyPaymentsConfig;
  squareConfig?: SquareConfig;
  paypalConfig?: PayPalConfig;
  mercadoPagoConfig?: MercadoPagoConfig;
  ccavenueConfig?: CCAvenueConfig;
  isConfirmingCheckout: boolean;
  setIsConfirmingCheckout: (isConfirming: boolean) => void;
  checkoutErrors?: string[] | undefined;
  setCheckoutErrors: (error?: string[] | undefined) => void;
  requiredFields?: { [key: string]: boolean };
  /**
   * Field names supplied through the `checkoutFormSchema` prop. Consumer rules
   * must always be validated, even when the built-in conditional validation
   * would skip that field for the current delivery/payment combination.
   */
  customSchemaFields?: string[];
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
  contactEmail: z
    .string()
    .min(1, 'Enter an email')
    .email('Enter a valid email'),
  deliveryMethod: z.nativeEnum(DeliveryMethods).describe('fulfillmentModes'),
  paymentUseShippingAddress: z.boolean().default(true),
  shippingFirstName: z.string().max(60),
  shippingLastName: z.string().max(60),
  shippingPhone: z.string().max(15, 'Phone number too long').optional(),
  shippingAddressLine1: z.string().max(300),
  shippingAddressLine2: z.string().max(300).optional(),
  shippingAddressLine3: z.string().max(300).optional(),
  shippingAdminArea4: z
    .string()
    .max(100)
    .describe('The neighborhood')
    .optional(),
  shippingAdminArea3: z
    .string()
    .max(100)
    .describe('City, town, or village')
    .optional(),
  shippingAdminArea2: z.string().max(100).describe('Sub-locality or suburb'),
  shippingAdminArea1: z.string().max(100).describe('State or province'),
  shippingPostalCode: z.string().max(60),
  shippingCountryCode: z.string().max(2),
  shippingMethod: z.string().optional(),
  billingFirstName: z.string().max(60),
  billingLastName: z.string().max(60),
  billingPhone: z.string().max(15, 'Phone number too long').optional(),
  billingAddressLine1: z.string().max(300),
  billingAddressLine2: z.string().max(300).optional(),
  billingAddressLine3: z.string().max(300).optional(),
  billingAdminArea4: z
    .string()
    .max(100)
    .describe('The neighborhood')
    .optional(),
  billingAdminArea3: z
    .string()
    .max(100)
    .describe('City, town, or village')
    .optional(),
  billingAdminArea2: z.string().max(100).describe('Sub-locality or suburb'),
  billingAdminArea1: z.string().max(100).describe('State or province'),
  billingPostalCode: z.string().max(60),
  billingCountryCode: z.string().max(2),
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

export type CheckoutFormSchema = Partial<{
  [K in keyof z.infer<typeof baseCheckoutSchema>]: z.ZodTypeAny;
}> &
  z.ZodRawShape;

export type CheckoutFormData = z.infer<typeof baseCheckoutSchema>;

export interface CheckoutProps {
  session?: CheckoutSession | undefined;
  appearance?: Appearance;
  isCheckoutDisabled?: boolean;
  stripeConfig?: StripeConfig;
  godaddyPaymentsConfig?: GodaddyPaymentsConfig;
  squareConfig?: SquareConfig;
  paypalConfig?: PayPalConfig;
  mercadoPagoConfig?: MercadoPagoConfig;
  ccavenueConfig?: CCAvenueConfig;
  layout?: LayoutSection[];
  direction?: 'ltr' | 'rtl';
  showStoreHours?: boolean;
  enableTracking?: boolean;
  trackingProperties?: TrackingProperties;
  targets?: Partial<
    Record<Target, (session?: CheckoutSession | null) => ReactNode>
  >;
  checkoutFormSchema?: CheckoutFormSchema;
  defaultValues?: Pick<CheckoutFormData, 'contactEmail'>;
  isLoading?: boolean;
  loadingFallback?: ReactNode;
}

export function Checkout(props: CheckoutProps) {
  const {
    checkoutFormSchema,
    enableTracking = false,
    trackingProperties,
    stripeConfig,
    godaddyPaymentsConfig,
    squareConfig,
    paypalConfig,
    mercadoPagoConfig,
    ccavenueConfig,
    isCheckoutDisabled,
  } = props;

  const [isConfirmingCheckout, setIsConfirmingCheckout] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('encResp');
  });
  const [checkoutErrors, setCheckoutErrors] = React.useState<
    string[] | undefined
  >(undefined);
  const { t } = useGoDaddyContext();

  const { session, jwt, isLoading: isLoadingJWT } = useCheckoutSession(props);
  useTheme(session?.appearance?.theme);
  useVariables(session?.appearance?.variables || props?.appearance?.variables);

  const validationMessages = React.useMemo<CheckoutValidationMessages>(
    () => ({
      enterValidBillingPhone: t.validation.enterValidBillingPhone,
      enterValidShippingPhone: t.validation.enterValidShippingPhone,
      enterFirstName: t.validation.enterFirstName,
      enterLastName: t.validation.enterLastName,
      enterAddress: t.validation.enterAddress,
      enterCity: t.validation.enterCity,
      enterZipPostalCode: t.validation.enterZipPostalCode,
      enterCountry: t.validation.enterCountry,
      selectState: t.validation.selectState,
    }),
    [t]
  );

  const validationAdapter = React.useMemo(
    () =>
      createCheckoutValidationAdapter({
        baseSchema: baseCheckoutSchema,
        checkoutFormSchema,
        messages: validationMessages,
        getContext: () => ({ session }),
      }),
    [checkoutFormSchema, session, validationMessages]
  );

  const requiredFields = React.useMemo(() => {
    return getRequiredFieldsFromSchema(validationAdapter.schema);
  }, [validationAdapter]);

  const customSchemaFields = React.useMemo(() => {
    return Object.keys(checkoutFormSchema ?? {});
  }, [checkoutFormSchema]);

  if (!props.isLoading && !isLoadingJWT && !session) {
    return (
      <div className='flex items-center justify-center min-h-[50vh] p-4'>
        <div className='max-w-md w-full'>
          <h2 className='text-lg font-semibold mb-4 text-destructive-foreground'>
            {t.general.godaddyCheckout}
          </h2>

          <div className='flex items-start mb-4 rounded-md border border-destructive bg-destructive/10 p-4 w-full'>
            <CircleAlert className='text-destructive w-5 h-5 mr-3 flex-shrink-0 mt-0.5' />
            <div className='text-destructive-foreground text-sm'>
              {t.apiErrors.CHECKOUT_SESSION_NOT_FOUND}
            </div>
          </div>

          <div className='text-xs text-muted-foreground border-t border-border pt-3 mt-4'>
            {t.general.poweredBy}{' '}
            <a
              href='https://www.godaddy.com'
              className='underline hover:text-foreground'
            >
              GoDaddy
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TrackingProvider
      session={session}
      trackingEnabled={enableTracking && !!session?.id}
      trackingProperties={trackingProperties}
    >
      <checkoutContext.Provider
        value={{
          elements: props?.appearance?.elements,
          targets: props?.targets,
          isCheckoutDisabled,
          session,
          jwt,
          stripeConfig,
          godaddyPaymentsConfig,
          squareConfig,
          mercadoPagoConfig,
          paypalConfig,
          ccavenueConfig,
          requiredFields,
          customSchemaFields,
          isConfirmingCheckout,
          setIsConfirmingCheckout,
          checkoutErrors,
          setCheckoutErrors,
        }}
      >
        <CheckoutFormContainer
          {...props}
          isLoadingJWT={isLoadingJWT}
          validationAdapter={validationAdapter}
          direction={props.direction}
        />
      </checkoutContext.Provider>
    </TrackingProvider>
  );
}
