import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
import type {
  Resolver,
  ResolverOptions,
  ResolverResult,
} from 'react-hook-form';
import { z } from 'zod';
import { hasRegionData } from '@/components/checkout/address';
import { checkIsValidPhone } from '@/components/checkout/address/utils/check-is-valid-phone';
import type {
  CheckoutFormData,
  CheckoutFormSchema,
} from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { resolveBillingPolicyForCheckoutState } from '@/components/checkout/payment/utils/use-billing-policy';
import type { CheckoutSession, Totals } from '@/types';

export type CheckoutValidationMessages = {
  enterValidBillingPhone: string;
  enterValidShippingPhone: string;
  enterFirstName: string;
  enterLastName: string;
  enterAddress: string;
  enterCity: string;
  enterZipPostalCode: string;
  enterCountry: string;
  selectState: string;
};

export type CheckoutValidationContext = {
  session?: CheckoutSession | null;
  totals?: Totals | null;
};

export type CheckoutValidationAdapter = {
  schema: z.ZodTypeAny;
  resolver: Resolver<CheckoutFormData, CheckoutValidationContext>;
  safeParseAsync: (
    values: CheckoutFormData,
    context?: CheckoutValidationContext
  ) => Promise<z.SafeParseReturnType<unknown, CheckoutFormData>>;
};

const SHIPPING_ADDRESS_FIELD_NAMES = new Set([
  'shippingFirstName',
  'shippingLastName',
  'shippingAddressLine1',
  'shippingAddressLine2',
  'shippingAddressLine3',
  'shippingAdminArea4',
  'shippingAdminArea3',
  'shippingAdminArea2',
  'shippingAdminArea1',
  'shippingPostalCode',
  'shippingCountryCode',
]);

const BILLING_ADDRESS_FIELD_NAMES = new Set([
  'billingAddressLine1',
  'billingAddressLine2',
  'billingAddressLine3',
  'billingAdminArea4',
  'billingAdminArea3',
  'billingAdminArea2',
  'billingAdminArea1',
  'billingPostalCode',
  'billingCountryCode',
]);

const BILLING_NAME_FIELD_NAMES = new Set([
  'billingFirstName',
  'billingLastName',
]);

function isBuiltInConditionalFieldHidden(
  fieldName: string,
  values: CheckoutFormData,
  context?: CheckoutValidationContext
) {
  const session = context?.session;
  const deliveryMethod = values.deliveryMethod;
  const isShipping = deliveryMethod === DeliveryMethods.SHIP;
  const shippingSectionIsCollectable = Boolean(
    isShipping && session?.enableShipping
  );
  const shippingAddressIsCollectable = Boolean(
    shippingSectionIsCollectable && session?.enableShippingAddressCollection
  );
  const policy = resolveBillingPolicyForCheckoutState({
    values,
    session,
    totals: context?.totals,
  });
  const billingIsCollectable = policy.mode !== 'none';
  const billingAddressIsCollectable = policy.mode === 'address';
  const phoneIsCollectable = session?.enablePhoneCollection === true;
  const notesAreCollectable = session?.enableNotesCollection === true;

  if (fieldName === 'shippingPhone') {
    return !shippingAddressIsCollectable || !phoneIsCollectable;
  }
  if (fieldName === 'billingPhone') {
    return !billingIsCollectable || !phoneIsCollectable;
  }
  if (SHIPPING_ADDRESS_FIELD_NAMES.has(fieldName)) {
    return !shippingAddressIsCollectable;
  }
  if (fieldName === 'shippingMethod') {
    return !shippingSectionIsCollectable;
  }
  if (BILLING_NAME_FIELD_NAMES.has(fieldName)) {
    return !billingIsCollectable;
  }
  if (BILLING_ADDRESS_FIELD_NAMES.has(fieldName)) {
    return !billingAddressIsCollectable;
  }
  if (fieldName === 'notes') {
    return !notesAreCollectable;
  }
  return false;
}

function filterIssuesForHiddenConditionalFields(
  issues: z.ZodIssue[],
  values: CheckoutFormData,
  context?: CheckoutValidationContext
) {
  return issues.filter(issue => {
    const [fieldName] = issue.path;
    return !(
      typeof fieldName === 'string' &&
      isBuiltInConditionalFieldHidden(fieldName, values, context)
    );
  });
}

function addRequiredIssue(
  ctx: z.RefinementCtx,
  data: CheckoutFormData,
  key: keyof CheckoutFormData,
  message: string
) {
  if (data[key]) return;

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path: [key],
  });
}

export function createCheckoutSchema(
  baseSchema: z.ZodObject<any>,
  checkoutFormSchema: CheckoutFormSchema | undefined,
  messages: CheckoutValidationMessages,
  context?: CheckoutValidationContext
) {
  const extendedSchema = checkoutFormSchema
    ? baseSchema.extend(checkoutFormSchema)
    : baseSchema;

  return extendedSchema.superRefine((schemaData, ctx) => {
    const data = schemaData as CheckoutFormData;
    if (data.billingPhone) {
      if (!checkIsValidPhone(String(data.billingPhone))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.enterValidBillingPhone,
          path: ['billingPhone'],
        });
      }
    }

    if (data.shippingPhone) {
      if (!checkIsValidPhone(String(data.shippingPhone))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.enterValidShippingPhone,
          path: ['shippingPhone'],
        });
      }
    }

    const policy = resolveBillingPolicyForCheckoutState({
      values: data,
      session: context?.session,
      totals: context?.totals,
    });

    if (policy.mode === 'names' || policy.mode === 'address') {
      addRequiredIssue(ctx, data, 'billingFirstName', messages.enterFirstName);
      addRequiredIssue(ctx, data, 'billingLastName', messages.enterLastName);
    }

    if (policy.mode === 'address') {
      addRequiredIssue(ctx, data, 'billingAddressLine1', messages.enterAddress);
      addRequiredIssue(ctx, data, 'billingAdminArea2', messages.enterCity);
      addRequiredIssue(
        ctx,
        data,
        'billingPostalCode',
        messages.enterZipPostalCode
      );
      addRequiredIssue(ctx, data, 'billingCountryCode', messages.enterCountry);

      if (hasRegionData(String(data.billingCountryCode))) {
        addRequiredIssue(ctx, data, 'billingAdminArea1', messages.selectState);
      }
    }

    const requireShippingAddress = Boolean(
      data.deliveryMethod === DeliveryMethods.SHIP &&
        context?.session?.enableShipping &&
        context?.session?.enableShippingAddressCollection
    );

    if (requireShippingAddress) {
      addRequiredIssue(ctx, data, 'shippingFirstName', messages.enterFirstName);
      addRequiredIssue(ctx, data, 'shippingLastName', messages.enterLastName);
      addRequiredIssue(
        ctx,
        data,
        'shippingAddressLine1',
        messages.enterAddress
      );
      addRequiredIssue(ctx, data, 'shippingAdminArea2', messages.enterCity);
      addRequiredIssue(
        ctx,
        data,
        'shippingPostalCode',
        messages.enterZipPostalCode
      );
      addRequiredIssue(ctx, data, 'shippingCountryCode', messages.enterCountry);

      if (hasRegionData(String(data.shippingCountryCode))) {
        addRequiredIssue(ctx, data, 'shippingAdminArea1', messages.selectState);
      }
    }
  });
}

function createZodError(issues: z.ZodIssue[]) {
  return new z.ZodError(issues);
}

type ParsedFieldError = {
  message: string;
  type: string;
  types?: Record<string, string | string[]>;
};

function parseErrorSchema(
  issues: z.ZodIssue[],
  validateAllFieldCriteria: boolean
) {
  const errors: Record<string, ParsedFieldError> = {};

  for (; issues.length; ) {
    const issue = issues[0];
    const path = issue.path.join('.');

    if (!errors[path]) {
      errors[path] = {
        message: issue.message,
        type: issue.code,
      };
    }

    if (validateAllFieldCriteria) {
      const types = errors[path]?.types;
      const messages = types?.[issue.code];
      errors[path] = {
        ...errors[path],
        types: {
          ...types,
          [issue.code]: messages
            ? ([] as string[]).concat(messages as string[], issue.message)
            : issue.message,
        },
      };
    }

    issues.shift();
  }

  return errors;
}

function createResolverResult(
  error: z.ZodError<CheckoutFormData>,
  options: ResolverOptions<CheckoutFormData>
): ResolverResult<CheckoutFormData> {
  return {
    values: {},
    errors: toNestErrors(
      parseErrorSchema(
        [...error.errors],
        !options.shouldUseNativeValidation && options.criteriaMode === 'all'
      ),
      options
    ),
  };
}

export function createCheckoutValidationAdapter({
  baseSchema,
  checkoutFormSchema,
  messages,
  getContext,
}: {
  baseSchema: z.ZodObject<any>;
  checkoutFormSchema?: CheckoutFormSchema;
  messages: CheckoutValidationMessages;
  getContext?: () => CheckoutValidationContext;
}): CheckoutValidationAdapter {
  const getValidationContext = (context?: CheckoutValidationContext) => ({
    ...(getContext?.() ?? {}),
    ...(context ?? {}),
  });

  const safeParseAsync: CheckoutValidationAdapter['safeParseAsync'] = async (
    values,
    context
  ) => {
    const data = values as CheckoutFormData;
    const validationContext = getValidationContext(context);
    const schema = createCheckoutSchema(
      baseSchema,
      checkoutFormSchema,
      messages,
      validationContext
    );
    const result = await schema.safeParseAsync(data);

    if (result.success) {
      return { success: true as const, data: result.data as CheckoutFormData };
    }

    const issues = filterIssuesForHiddenConditionalFields(
      result.error.issues,
      data,
      validationContext
    );

    return issues.length
      ? { success: false as const, error: createZodError(issues) }
      : { success: true as const, data };
  };

  return {
    schema: createCheckoutSchema(baseSchema, checkoutFormSchema, messages),
    safeParseAsync,
    resolver: async (values, context, options) => {
      const result = await safeParseAsync(values, context);

      if (result.success) {
        if (options.shouldUseNativeValidation) {
          validateFieldsNatively({}, options);
        }
        return {
          errors: {},
          values: result.data,
        };
      }

      return createResolverResult(result.error, options);
    },
  };
}
